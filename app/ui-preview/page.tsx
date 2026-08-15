"use client"

import React, { useState } from "react"
import { 
  Button, Card, CardHeader, CardTitle, CardContent, 
  Input, Badge, Skeleton, Tabs, TabsList, TabsTrigger, TabsContent,
  Label, Textarea, Checkbox, Switch, Alert, AlertTitle, AlertDescription,
  Select, Popover, Tooltip, Avatar 
} from "@/components/ui"
import { Toaster } from "@/components/ui/sonner"
function toast(msg: string) { console.log(msg) }
toast.success = (msg: string) => console.log(msg)
toast.error = (msg: string) => console.error(msg)

export default function UIPreviewPage() {
  const [switchChecked, setSwitchChecked] = useState(false)
  const [checkboxChecked, setCheckboxChecked] = useState(false)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight">Harbourview UI Library</h1>
          <p className="text-muted-foreground mt-2">Interactive preview of all components</p>
        </div>

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
        </section>

        {/* Badges */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
          </div>
        </section>

        {/* Form Elements */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Form Elements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter your name" />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="Type your message here..." />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Select id="country">
                  <option>Canada</option>
                  <option>United States</option>
                  <option>Germany</option>
                </Select>
              </div>
            </div>
            
            <div className="space-y-6 pt-2">
              <div className="flex items-center gap-3">
                <Checkbox 
                  checked={checkboxChecked} 
                  onChange={(e) => setCheckboxChecked(e.target.checked)} 
                />
                <Label>Accept terms and conditions</Label>
              </div>

              <div className="flex items-center gap-3">
                <Switch 
                  checked={switchChecked} 
                  onCheckedChange={setSwitchChecked} 
                />
                <Label>Enable notifications</Label>
              </div>
            </div>
          </div>
        </section>

        {/* Alerts */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Alerts</h2>
          <div className="space-y-4">
            <Alert>
              <AlertTitle>Default Alert</AlertTitle>
              <AlertDescription>This is a standard information alert.</AlertDescription>
            </Alert>
            <Alert variant="success">
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>Your changes have been saved successfully.</AlertDescription>
            </Alert>
            <Alert variant="warning">
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>Please review the data before proceeding.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Something went wrong. Please try again.</AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Tabs */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Tabs</h2>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="signals">Signals</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Overview Content</CardTitle>
                </CardHeader>
                <CardContent>
                  This is the overview tab content.
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="signals" className="mt-4">
              Live signals would appear here.
            </TabsContent>
            <TabsContent value="settings" className="mt-4">
              Settings panel content.
            </TabsContent>
          </Tabs>
        </section>

        {/* Toast Demo */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Toasts (Sonner)</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => toast("This is a default toast")}>
              Default Toast
            </Button>
            <Button 
              variant="outline" 
              onClick={() => toast.success("Operation completed successfully!")}
            >
              Success Toast
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => toast.error("Something went wrong")}
            >
              Error Toast
            </Button>
          </div>
        </section>

        {/* Loading States */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Loading States</h2>
          <div className="space-y-3 max-w-md">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        </section>

        {/* Advanced Components */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Advanced Components</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Popover */}
            <div>
              <h3 className="font-medium mb-2">Popover</h3>
              <Popover content={<div className="p-2">This is popover content!</div>}>
                <Button variant="outline">Open Popover</Button>
              </Popover>
            </div>

            {/* Tooltip */}
            <div>
              <h3 className="font-medium mb-2">Tooltip</h3>
              <Tooltip content="This is a helpful tooltip">
                <Button variant="secondary">Hover me</Button>
              </Tooltip>
            </div>

            {/* Avatar */}
            <div>
              <h3 className="font-medium mb-2">Avatar</h3>
              <div className="flex gap-3">
                <Avatar fallback="TC" />
                <Avatar src="https://i.pravatar.cc/40" alt="User" />
              </div>
            </div>

            {/* Sheet */}
            <div>
              <h3 className="font-medium mb-2">Sheet (Side Drawer)</h3>
              <Button 
                variant="outline" 
                onClick={() => {
                  // This would need state in a real app
                  alert("Sheet would open here in a real implementation")
                }}
              >
                Open Sheet
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Toaster position="top-center" richColors />
    </div>
  )
}
