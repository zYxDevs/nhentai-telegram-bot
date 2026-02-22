import { NotFoundError, searchResult, Source } from "./index.js";
import { IncomingHttpHeaders } from "http";
import * as cheerio from "cheerio";
import got, { Response } from "got";
import { CookieJar } from "tough-cookie";
import Doujin from "./doujin.js";
import Werror from "../lib/error.js";
import resolveSourceRequestOptions, {
  SourceRequestOptions,
} from "./request-options.js";

interface FlareSolverrSolution {
  response: string;
  status: number;
  url: string;
}

interface FlareSolverrResponse {
  status: string;
  message?: string;
  solution?: FlareSolverrSolution;
}

interface ResponseLike {
  body: string;
  statusCode: number;
  url: string;
}

export default class eHentai implements Source {
  baseUrl: string;
  cookieJar: CookieJar;
  headers: IncomingHttpHeaders;
  flaresolverrUrl?: string;
  flaresolverrProxyUrl?: string;
  flaresolverrMaxTimeout: number;

  constructor(
    baseUrl?: string,
    cookieJar?: CookieJar,
    headers?: IncomingHttpHeaders,
    requestOptions?: Partial<SourceRequestOptions>,
  ) {
    const sourceRequestOptions = resolveSourceRequestOptions(requestOptions);

    this.baseUrl = baseUrl || "https://ehentai.to";
    this.cookieJar = cookieJar || new CookieJar();
    this.headers = headers || {};
    this.flaresolverrUrl = sourceRequestOptions.flaresolverrUrl;
    this.flaresolverrProxyUrl = sourceRequestOptions.flaresolverrProxyUrl;
    this.flaresolverrMaxTimeout = sourceRequestOptions.flaresolverrMaxTimeout;
  }

  async doujin(identifier: string): Promise<Doujin> {
    let response: ResponseLike;
    try {
      response = await this.requestGet(this.baseUrl + "/g/" + identifier + "/");
    } catch (error) {
      throw new Werror(error, "Making request");
    }

    if (response.statusCode === 404) {
      throw new NotFoundError();
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Werror("Unexpected status code: " + response.statusCode);
    }

    let doujin: Doujin;
    try {
      doujin = this.parseDoujin(identifier, response.body);
    } catch (error) {
      throw new Werror(error, "Parsing doujin");
    }

    return doujin;
  }

  async random(): Promise<Doujin> {
    let response: ResponseLike;
    try {
      response = await this.requestGet(this.baseUrl + "/random/");
    } catch (error) {
      throw new Werror(error, "Making request");
    }

    if (response.statusCode === 404) {
      throw new NotFoundError();
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Werror("Unexpected status code: " + response.statusCode);
    }

    const id = new URL(response.url).pathname.split("/")[2];
    if (!id) {
      throw new Werror("Could not find id in url");
    }

    let doujin: Doujin;
    try {
      doujin = this.parseDoujin(id, response.body);
    } catch (error) {
      throw new Werror(error, "Parsing doujin");
    }

    return doujin;
  }

  async search(query: string, page = 0): Promise<searchResult> {
    const url = new URL("/search/", this.baseUrl);
    url.searchParams.set("q", query);
    if (page > 1) {
      url.searchParams.set("page", page.toString());
    }

    let response: ResponseLike;
    try {
      response = await this.requestGet(url.toString());
    } catch (err) {
      throw new Werror(err, "Making search request");
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Werror("Unexpected status code: " + response.statusCode);
    }

    let result: searchResult;
    try {
      result = this.parseSearchResults(response.body);
    } catch (err) {
      throw new Werror(err, "Parsing search results");
    }

    return result;
  }

  private async requestGet(url: string): Promise<ResponseLike> {
    if (!this.flaresolverrUrl) {
      const response = await got(url, {
        throwHttpErrors: false,
      });

      return {
        body: response.body,
        statusCode: response.statusCode,
        url: response.url,
      };
    }

    let response: Response<FlareSolverrResponse>;
    try {
      response = await got.post(
        new URL("/v1", this.flaresolverrUrl).toString(),
        {
          json: {
            cmd: "request.get",
            url,
            maxTimeout: this.flaresolverrMaxTimeout,
            ...(this.flaresolverrProxyUrl
              ? { proxy: { url: this.flaresolverrProxyUrl } }
              : {}),
          },
          responseType: "json",
        },
      );
    } catch (err) {
      throw new Werror(err, "Making FlareSolverr request");
    }

    if (response.body.status !== "ok" || !response.body.solution) {
      throw new Werror(response.body.message || "FlareSolverr request failed");
    }

    return {
      body: response.body.solution.response,
      statusCode: response.body.solution.status,
      url: response.body.solution.url,
    };
  }

  private parseDoujin(id: string, body: string): Doujin {
    const $ = cheerio.load(body);

    const titleTranslated = $("#info h1").text();
    const titleOriginal = $("#info h2").text();
    const numberOfPages = parseInt(
      $('#info > div:contains("pages")').text().trim(),
      10,
    );

    const thumbnails = $("#thumbnail-container a.gallerythumb img").map(
      (_, a) => {
        const url = a.attribs["data-src"] || a.attribs["src"];
        if (!url) {
          throw new Werror("Could not find href in thumbnail");
        }
        return url;
      },
    );
    const thumbnail = thumbnails[0];
    if (!thumbnail) {
      throw new Werror("Could not find cover thumbnail");
    }

    const pages: string[] = [...thumbnails].map((href, page) => {
      return href
        .replace(/\/\d+t\.jpg$/, `/${page + 1}.jpg`)
        .replace(/\/\d+t\.png$/, `/${page + 1}.png`)
        .replace(/\/\d+t\.gif$/, `/${page + 1}.gif`);
    });

    const details: Doujin["details"] = {
      parodies: [],
      characters: [],
      tags: [],
      artists: [],
      groups: [],
      languages: [],
      categories: [],
      pages: numberOfPages,
      uploaded: {
        datetime: new Date(),
        pretty: new Date().toLocaleString(),
      },
    };
    const tagContainers = $("#tags > .tag-container");
    for (const container of tagContainers) {
      const name = container.children.find((c) => c.type === "text");
      if (!name || !("data" in name)) {
        throw new Werror("Could not find name in tag container");
      }

      const tags = $(container)
        .find("span.tags > a")
        .map((_, a) => {
          const el = $(a);
          const href = el.attr("href");
          if (!href) {
            throw new Werror("Could not find href in tag");
          }
          const name = el.find("span.name").text().trim();
          if (!href) {
            throw new Werror("Could not find name in tag");
          }

          return {
            name,
            url: new URL(href, this.baseUrl).toString(),
          };
        });

      switch (name.data.trim()) {
        case "Tags":
          details.tags.push(...tags);
          break;
        case "Artists":
          details.artists.push(...tags);
          break;
        case "Groups":
          details.groups.push(...tags);
          break;
        case "Languages":
          details.languages.push(...tags);
          break;
        case "Categories":
          details.categories.push(...tags);
          break;
        case "Characters":
          details.characters.push(...tags);
          break;
        case "Parodies":
          details.parodies.push(...tags);
          break;
        default:
          throw new Werror("Unknown tag container name: " + name.data);
      }
    }

    return {
      id: id,
      title: {
        translated: {
          full: titleTranslated,
          pretty: titleTranslated,
        },
        original: {
          full: titleOriginal,
          pretty: titleOriginal,
        },
      },
      url: this.baseUrl + "/g/" + id + "/",
      details: details,
      pages,
      thumbnail,
    };
  }

  parseSearchResults(page: string): searchResult {
    const $ = cheerio.load(page);
    const total = parseInt($("body h2").text());

    const doujins = $(".container > .gallery a").map((_, a) => {
      const el = $(a);
      const href = el.attr("href");
      if (!href) {
        throw new Werror("Could not find href in doujin");
      }
      const url = new URL(href, this.baseUrl).toString();

      const id = href.replace(/^\/g\/(\d+)\/$/, "$1");

      const caption = el.find(".caption").text().trim();
      if (!caption) {
        throw new Werror("Could not find title in doujin");
      }

      const thumbnail =
        el.find("img").attr("data-src") || el.find("img").attr("src");
      if (!thumbnail) {
        throw new Werror("Could not find thumbnail in doujin");
      }

      return {
        id,
        url,
        caption,
        thumbnail,
      };
    });

    return {
      results: doujins.toArray(),
      total,
    };
  }
}
