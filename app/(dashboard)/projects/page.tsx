"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { FolderKanban, Pencil, Eye, MoreVertical } from "lucide-react";
import { usePosData } from "@/components/pos-data-provider";
import { useLanguage } from "@/components/language-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProjectsPage() {
  const { t } = useLanguage();
  const { projects, customers, addCustomerProject, updateCustomerProject } =
    usePosData();

  const [query, setQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  const [customerId, setCustomerId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [projectNotes, setProjectNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const customerMap = useMemo(
    () =>
      customers.reduce<Record<string, string>>((acc, customer) => {
        acc[customer.id] = customer.name;
        return acc;
      }, {}),
    [customers]
  );

  const sortedProjects = useMemo(
    () =>
      [...projects].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return sortedProjects;
    return sortedProjects.filter((project) => {
      const customerName = customerMap[project.customerId] || "";
      return (
        project.name.toLowerCase().includes(normalized) ||
        customerName.toLowerCase().includes(normalized) ||
        (project.location || "").toLowerCase().includes(normalized)
      );
    });
  }, [query, sortedProjects, customerMap]);

  const resetForm = () => {
    setCustomerId("");
    setProjectName("");
    setProjectLocation("");
    setProjectNotes("");
  };

  const openEdit = (projectId: string) => {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    setSelectedProjectId(project.id);
    setCustomerId(project.customerId);
    setProjectName(project.name);
    setProjectLocation(project.location || "");
    setProjectNotes(project.notes || "");
    setIsEditOpen(true);
  };

  const handleAdd = async () => {
    if (!customerId || !projectName.trim()) return;
    try {
      setIsSaving(true);
      await addCustomerProject({
        customerId,
        name: projectName,
        location: projectLocation,
        notes: projectNotes,
      });
      setIsAddOpen(false);
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async () => {
    const project = projects.find((item) => item.id === selectedProjectId);
    if (!project || !customerId || !projectName.trim()) return;
    try {
      setIsSaving(true);
      await updateCustomerProject({
        ...project,
        customerId,
        name: projectName,
        location: projectLocation || undefined,
        notes: projectNotes || undefined,
      });
      setIsEditOpen(false);
      setSelectedProjectId("");
      resetForm();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 overflow-hidden min-w-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <FolderKanban className="h-6 w-6 text-primary" />
          {t("projects.title")}
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          {t("projects.subtitle")}
        </p>
      </div>

      <Card className="border-2">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              {/* <CardTitle>Project Directory</CardTitle> */}
              <CardDescription>
                {filteredProjects.length}{" "}
                {filteredProjects.length === 1 ? t("projects.project") : t("projects.projects")} {t("projects.found")}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Input
                placeholder={t("projects.searchPlaceholder")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="sm:max-w-xs"
              />
              <Button
                onClick={() => {
                  resetForm();
                  setIsAddOpen(true);
                }}
              >
                {t("projects.addProject")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("projects.project")}</TableHead>
                    <TableHead>{t("projects.customer")}</TableHead>
                    <TableHead>{t("customers.location")}</TableHead>
                    <TableHead>{t("projects.updated")}</TableHead>
                    <TableHead className="text-end">{t("customers.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      {customerMap[project.customerId] || t("projects.unknownCustomer")}
                    </TableCell>
                    <TableCell>{project.location || "—"}</TableCell>
                    <TableCell>
                      {format(new Date(project.updatedAt), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/projects/${encodeURIComponent(project.id)}`}
                              className="flex items-center"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {t("projects.view")}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(project.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("projects.edit")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("projects.addProject")}</DialogTitle>
            <DialogDescription>
              {t("projects.addProjectDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("projects.customer")}</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("projects.selectCustomer")} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("projects.projectName")}</Label>
              <Input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder={t("projects.projectNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("customers.location")}</Label>
              <Input
                value={projectLocation}
                onChange={(event) => setProjectLocation(event.target.value)}
                placeholder={t("projects.locationPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("projects.notes")}</Label>
              <Textarea
                value={projectNotes}
                onChange={(event) => setProjectNotes(event.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              disabled={isSaving}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleAdd}
              disabled={isSaving || !customerId || !projectName.trim()}
            >
              {isSaving ? t("projects.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("projects.editProject")}</DialogTitle>
            <DialogDescription>
              {t("projects.editProjectDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("projects.customer")}</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("projects.selectCustomer")} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("projects.projectName")}</Label>
              <Input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("customers.location")}</Label>
              <Input
                value={projectLocation}
                onChange={(event) => setProjectLocation(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("projects.notes")}</Label>
              <Textarea
                value={projectNotes}
                onChange={(event) => setProjectNotes(event.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={isSaving}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleEdit}
              disabled={isSaving || !customerId || !projectName.trim()}
            >
              {isSaving ? t("projects.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
