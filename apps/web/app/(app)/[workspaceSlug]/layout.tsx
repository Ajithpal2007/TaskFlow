import { SidebarLeft } from "@/components/layout/sidebar-left"
//import { SidebarRight } from "@/components/layout/sidebar-right"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui/components/sidebar"
import { Separator } from "@repo/ui/components/separator"
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@repo/ui/components/breadcrumb"

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      {/* The Navigation Sidebar */}
      <SidebarLeft /> 

      <SidebarInset>
        {/* Top Header with Breadcrumbs */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">TaskFlow</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* This is where your actual Dashboard page will appear */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children} 
        </div>
      </SidebarInset>

      {/* The Calendar Sidebar */}
      {/*<SidebarRight /> */}
    </SidebarProvider>
  )
}