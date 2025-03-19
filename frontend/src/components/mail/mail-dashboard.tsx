"use client"

import * as React from "react"
import {
  AlertCircle,
  Archive,
  ArchiveX,
  File,
  Inbox,
  MessagesSquare,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  Users2,
  BarChart,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"

import { Input } from "../ui/input"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../ui/resizable"
import { Separator } from "../ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs"
import { TooltipProvider } from "../ui/tooltip"
import { AccountSwitcher } from "./account-switcher"
import { MailDisplay } from "./mail-display"
import { MailList } from "./mail-list"
import { Nav } from "./nav"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"

export interface MailItem {
  id: string
  name: string
  email: string
  subject: string
  text: string
  date: string
  read: boolean
  labels: string[]
  audit?: any // Original audit data
}

interface MailDashboardProps {
  mails: MailItem[]
  defaultLayout?: number[]
  defaultCollapsed?: boolean
  navCollapsedSize: number
  onViewDetails?: (id: string) => void
}

export function MailDashboard({
  mails,
  defaultLayout = [20, 32, 48],
  defaultCollapsed = false,
  navCollapsedSize,
  onViewDetails,
}: MailDashboardProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  const [mail, setMail] = React.useState<{ selected: string | null }>({
    selected: mails.length > 0 ? mails[0].id : null,
  })
  const navigate = useNavigate()
  const { user } = useAuth()

  // Mock accounts data
  const accounts = [
    {
      label: user?.email || "User",
      email: user?.email || "user@example.com",
      icon: (
        <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <title>User</title>
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" />
        </svg>
      ),
    }
  ]

  const handleViewDetails = (id: string) => {
    if (onViewDetails) {
      onViewDetails(id);
    } else {
      console.log(`View details for audit: ${id}`);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full w-full max-h-[85vh] items-stretch rounded-lg border"
      >
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={15}
          maxSize={20}
          onCollapse={() => {
            setIsCollapsed(true)
          }}
          onResize={() => {
            setIsCollapsed(false)
          }}
          className={isCollapsed ? "min-w-[50px] transition-all duration-300 ease-in-out" : ""}
        >
          <div className={`flex h-[52px] items-center justify-center ${isCollapsed ? "h-[52px]" : "px-2"}`}>
            <AccountSwitcher isCollapsed={isCollapsed} accounts={accounts} />
          </div>
          <Separator />
          <Nav
            isCollapsed={isCollapsed}
            links={[
              {
                title: "All Audits",
                label: `${mails.length}`,
                icon: Inbox,
                variant: "default",
              },
              {
                title: "Completed",
                label: `${mails.filter(m => m.labels.includes('completed')).length}`,
                icon: CheckCircle,
                variant: "ghost",
              },
              {
                title: "In Progress",
                label: `${mails.filter(m => m.labels.includes('in_progress')).length}`,
                icon: Clock,
                variant: "ghost",
              },
              {
                title: "Failed",
                label: `${mails.filter(m => m.labels.includes('failed')).length}`,
                icon: AlertTriangle,
                variant: "ghost",
              },
              {
                title: "Pending",
                label: `${mails.filter(m => m.labels.includes('pending')).length}`,
                icon: Clock,
                variant: "ghost",
              },
            ]}
          />
          <Separator />
          <Nav
            isCollapsed={isCollapsed}
            links={[
              {
                title: "Analytics",
                label: "",
                icon: BarChart,
                variant: "ghost",
              },
              {
                title: "Reports",
                label: "",
                icon: FileText,
                variant: "ghost",
              },
              {
                title: "Alerts",
                label: "",
                icon: AlertCircle,
                variant: "ghost",
              },
            ]}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <Tabs defaultValue="all">
            <div className="flex items-center px-4 py-2">
              <h1 className="text-xl font-bold">Audit Dashboard</h1>
              <TabsList className="ml-auto">
                <TabsTrigger value="all">All audits</TabsTrigger>
                <TabsTrigger value="unread">In progress</TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search audits..." className="pl-8" />
                </div>
              </form>
            </div>
            <TabsContent value="all" className="m-0">
              <MailList 
                items={mails} 
                onSelect={(id) => {
                  setMail({ selected: id });
                }}
                selectedId={mail.selected}
              />
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              <MailList 
                items={mails.filter((item) => !item.read)} 
                onSelect={(id) => {
                  setMail({ selected: id });
                }}
                selectedId={mail.selected}
              />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
          <MailDisplay
            mail={mails.find((item) => item.id === mail.selected) || null}
            onViewDetails={handleViewDetails}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  )
} 