
"use client";
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
// import { useToast } from "@/components/ui/use-toast"
import { TiTick } from "react-icons/ti"
import { RxCross2 } from "react-icons/rx"
import bugReportApi from "@/Apis/bugReportApi"
import { useToast } from "@/hooks/use-toast";

export function BugReportDialog({ onSuccess }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [formData, setFormData] = useState({
    title: "",
    description: ""
  })
  const { toast } = useToast()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)

    const submitFormData = new FormData()

    // Add form fields
    submitFormData.append("title", formData.title)
    submitFormData.append("description", formData.description)

    // Add attachments to form data
    attachments.forEach((file) => {
      submitFormData.append("attachments", file)
    })

    try {
      const response = await bugReportApi.createBug(submitFormData);

      if (response.success) {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-green-500 rounded-full text-lg">
                <TiTick />
              </div>
              <span>{response?.message}</span>
            </div>
          ),
        });
        setOpen(false)
        onSuccess();
      } else {
        toast({
          title: (
            <div className="flex gap-2 items-center">
              <div className="text-white bg-red-500 rounded-full text-lg">
                <RxCross2 />
              </div>
              <span>{response?.error}</span>
            </div>
          ),
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create bug report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files)
    // Validate file count
    if (files.length + attachments.length > 5) {
      toast({
        title: "Too many files",
        description: "Maximum 5 files allowed",
        variant: "destructive",
      })
      return
    }

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > 20 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: "Each file must be less than 20MB",
        variant: "destructive",
      })
      return
    }
   
    setAttachments(prev => [...prev, ...files])
  }

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleOpenChange = (open) => {
    if (open) {
      // Reset everything when dialog opens
      setFormData({
        title: "",
        description: ""
      })
      setAttachments([])
      setIsLoading(false)
    }
    setOpen(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button >Report Bug</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90%] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Report a Bug</DialogTitle>
          <DialogDescription>
            Fill out the form below to report a bug. You can attach up to 5 files (max 20MB each).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Brief description of the issue"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Detailed description of the bug, steps to reproduce, expected vs actual behavior..."
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachments">Attachments</Label>
            <Input
              id="attachments"
              type="file"
              multiple
              onChange={handleFileChange}
              accept="*/*"
              disabled={attachments.length >= 5}
            />
            <p className="text-sm text-muted-foreground">
              Max 5 files, 20MB each. {attachments.length}/5 files selected.
            </p>

            {/* Display selected files */}
            {attachments.length > 0 && (
              <div className="space-y-2 mt-2">
                <p className="text-sm font-medium">Selected files:</p>
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}