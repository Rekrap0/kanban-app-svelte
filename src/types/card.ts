export interface Comment {
	author: string;
	text: string;
	timestamp: string;
}

export interface Card {
	id: string;
	title: string;
	board: string;
	column: string;
	tags: string[];
	dueDate: string;
	description: string;
	comments: Comment[];
	versions: any[];
}
