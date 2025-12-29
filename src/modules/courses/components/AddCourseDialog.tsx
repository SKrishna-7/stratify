"use client";

import { useState } from "react";
import { createCourse } from "../../../actions/course"; // Import the server action
import { Button } from "@/components/ui/button"
import {
    Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,

} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";

export function AddCourseDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <PlusCircle className="w-4 h-4" />
          New Course
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Study Course</DialogTitle>
        </DialogHeader>
        
        {/* The Form connects directly to the Server Action */}
        <form 
          action={async (formData) => {
            await createCourse(formData);
            setOpen(false); // Close modal after submit
          }} 
          className="grid gap-4 py-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="title">Course Title</Label>
            <Input id="title" name="title" placeholder="e.g. DSA, Aptitude" required />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" name="description" placeholder="Short goal for this course..." />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="color">Color Theme</Label>
            <select 
              name="color" 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="#0f172a">Slate (Default)</option>
              <option value="#dc2626">Red (Urgent)</option>
              <option value="#2563eb">Blue (Tech)</option>
              <option value="#16a34a">Green (Easy)</option>
            </select>
          </div>

          <div className="flex justify-end mt-4">
            <Button type="submit">Create Course</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}