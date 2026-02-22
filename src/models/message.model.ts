export interface MessageI {
	chat_id: string
	message_id: number
	current?: number
	history: string[]
	createdAt?: Date
	updatedAt?: Date
}

export type Message = MessageI
