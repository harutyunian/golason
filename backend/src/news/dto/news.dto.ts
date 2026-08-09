export class CreateNewsDto {
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
}

export class UpdateNewsDto {
  title?: string;
  summary?: string;
  content?: string;
  imageUrl?: string;
}
