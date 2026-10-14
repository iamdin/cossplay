import { Badge } from "@cossplay/ui/components/badge"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@cossplay/ui/components/table"

export default function Particle() {
  return (
    <Table>
      <TableCaption>当前项目列表。</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>项目</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>团队</TableHead>
          <TableHead className="text-right">预算</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">网站改版</TableCell>
          <TableCell>
            <Badge variant="outline">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-emerald-500"
              />
              已付款
            </Badge>
          </TableCell>
          <TableCell>前端团队</TableCell>
          <TableCell className="text-right">$12,500</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">移动应用</TableCell>
          <TableCell>
            <Badge variant="outline">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-muted-foreground/64"
              />
              未付款
            </Badge>
          </TableCell>
          <TableCell>移动团队</TableCell>
          <TableCell className="text-right">$8,750</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">API 集成</TableCell>
          <TableCell>
            <Badge variant="outline">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-amber-500"
              />
              待处理
            </Badge>
          </TableCell>
          <TableCell>后端团队</TableCell>
          <TableCell className="text-right">$5,200</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">数据库迁移</TableCell>
          <TableCell>
            <Badge variant="outline">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-emerald-500"
              />
              已付款
            </Badge>
          </TableCell>
          <TableCell>运维团队</TableCell>
          <TableCell className="text-right">$3,800</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">用户仪表盘</TableCell>
          <TableCell>
            <Badge variant="outline">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-emerald-500"
              />
              已付款
            </Badge>
          </TableCell>
          <TableCell>体验团队</TableCell>
          <TableCell className="text-right">$7,200</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">安全审计</TableCell>
          <TableCell>
            <Badge variant="outline">
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-red-500"
              />
              失败
            </Badge>
          </TableCell>
          <TableCell>安全团队</TableCell>
          <TableCell className="text-right">$2,100</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>预算合计</TableCell>
          <TableCell className="text-right">$39,550</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
