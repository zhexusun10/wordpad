import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const mockBooks = [
  {
    id: "1",
    name: "基础词汇A1",
    wordCount: 1200,
    updatedAt: "2024-08-12",
    status: "已发布",
  },
  {
    id: "2",
    name: "雅思核心词汇",
    wordCount: 2200,
    updatedAt: "2024-09-30",
    status: "草稿",
  },
];

export default function BooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">单词书管理</h2>
        <p className="text-muted-foreground">查看、创建和发布单词书。</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {mockBooks.map((book) => (
          <Card key={book.id}>
            <CardHeader>
              <CardTitle>{book.name}</CardTitle>
              <CardDescription>
                状态：{book.status} · 单词数 {book.wordCount}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              最近更新：{book.updatedAt}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

