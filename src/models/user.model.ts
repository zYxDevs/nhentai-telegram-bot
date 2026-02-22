export interface UserI {
	id: string
	username?: string
	first_name?: string
	last_name?: string
	language_code?: string
	settings: {
		search_sorting?: string
		search_type?: string
		empty_query?: string
		default_search_query?: string
		random_locally?: boolean
		can_repeat_in_random?: boolean
		ignored_random_tags?: string[]
		default_random_tags?: string[]
	}
	favorites: string[]
	history: string[]
	search_history: string[]
	createdAt?: Date
	updatedAt?: Date
}

export type User = UserI
