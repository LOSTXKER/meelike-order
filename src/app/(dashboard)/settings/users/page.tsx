"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Shield, Mail, Calendar, RefreshCw, Crown, Users, Headphones, UserCog } from "lucide-react";
import { format } from "date-fns";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-users";
import { LoadingScreen } from "@/components/ui/loading-screen";

const ROLES = [
  { 
    value: "ADMIN", 
    label: "Admin", 
    color: "bg-red-500",
    icon: UserCog,
    description: "รับเรื่องจากลูกค้า สร้างเคส แจ้งลูกค้า จัดการผู้ใช้และตั้งค่าระบบ"
  },
  { 
    value: "SUPPORT", 
    label: "Support", 
    color: "bg-green-500",
    icon: Headphones,
    description: "รับเคสที่ถูกมอบหมาย แก้ไขปัญหา อัพเดทสถานะเคสและออเดอร์"
  },
  { 
    value: "MANAGER", 
    label: "Manager", 
    color: "bg-blue-500",
    icon: Users,
    description: "ดูแลและมอบหมายงานให้ทีม ช่วยแก้ไขเคสยาก ตรวจสอบ SLA"
  },
  { 
    value: "CEO", 
    label: "CEO", 
    color: "bg-purple-500",
    icon: Crown,
    description: "สิทธิ์เต็มเหมือน Admin - ดูแลระบบทั้งหมด ดูรายงาน ตัดสินใจ"
  },
];

export default function UsersPage() {
  const { data: users = [], isLoading, refetch, isFetching } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "SUPPORT",
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      await createUser.mutateAsync(formData);
      toast.success("สร้างผู้ใช้สำเร็จ");
      setIsDialogOpen(false);
      setFormData({ name: "", email: "", password: "", role: "SUPPORT" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "ไม่สามารถสร้างผู้ใช้ได้";
      toast.error(message);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateUser.mutateAsync({ id, data: { isActive } });
      toast.success(isActive ? "เปิดใช้งานผู้ใช้แล้ว" : "ปิดใช้งานผู้ใช้แล้ว");
    } catch {
      toast.error("ไม่สามารถอัพเดทสถานะได้");
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await updateUser.mutateAsync({ id, data: { role } });
      const roleInfo = ROLES.find(r => r.value === role);
      toast.success("เปลี่ยน Role สำเร็จ", {
        description: `เปลี่ยนเป็น ${roleInfo?.label} แล้ว`,
      });
    } catch {
      toast.error("ไม่สามารถเปลี่ยน Role ได้");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณแน่ใจว่าต้องการลบผู้ใช้ "${name}" ออกจากระบบถาวร?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้`)) return;

    try {
      await deleteUser.mutateAsync(id);
      toast.success("ลบผู้ใช้สำเร็จ");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "ไม่สามารถลบผู้ใช้ได้";
      toast.error(message);
    }
  };

  const getRoleInfo = (role: string) => {
    return ROLES.find((r) => r.value === role) || ROLES[2];
  };

  if (isLoading) {
    return <LoadingScreen title="กำลังโหลดข้อมูลผู้ใช้" variant="dots" />;
  }

  return (
    <div className="min-h-screen">
      <Header title="จัดการผู้ใช้งาน" />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <p className="text-muted-foreground">
              จัดการผู้ใช้งานและสิทธิ์การเข้าถึงระบบ
            </p>
            {isFetching && (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              รีเฟรช
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มผู้ใช้
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
                  <DialogDescription>
                    สร้างบัญชีผู้ใช้งานใหม่ในระบบ
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>ชื่อ-นามสกุล *</Label>
                    <Input
                      placeholder="นายสมชาย ใจดี"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>อีเมล *</Label>
                    <Input
                      type="email"
                      placeholder="user@meelike.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>รหัสผ่าน *</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      รหัสผ่านควรมีความยาวอย่างน้อย 8 ตัวอักษร
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>บทบาท</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => {
                          const IconComponent = role.icon;
                          return (
                            <SelectItem key={role.value} value={role.value}>
                              <div className="flex items-start gap-2">
                                <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div className="font-medium">{role.label}</div>
                                  <div className="text-xs text-muted-foreground max-w-[250px]">
                                    {role.description}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {/* แสดงคำอธิบาย Role ที่เลือก */}
                    {formData.role && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5 p-2 bg-muted/50 rounded">
                        <Shield className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        {ROLES.find(r => r.value === formData.role)?.description}
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={handleSubmit} disabled={createUser.isPending}>
                    {createUser.isPending ? "กำลังสร้าง..." : "สร้างผู้ใช้"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>ผู้ใช้ทั้งหมด</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>ผู้ใช้ที่ใช้งานอยู่</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter((u) => u.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Admin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {users.filter((u) => u.role === "ADMIN").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Support</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {users.filter((u) => u.role === "SUPPORT").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>รายการผู้ใช้งาน</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ผู้ใช้</TableHead>
                  <TableHead>บทบาท</TableHead>
                  <TableHead>เคสที่รับผิดชอบ</TableHead>
                  <TableHead>วันที่สร้าง</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-8 rounded-full ${roleInfo.color} flex items-center justify-center text-white font-semibold`}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleRoleChange(user.id, value)}
                          disabled={updateUser.isPending}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <div className="flex items-center gap-1.5">
                              {(() => {
                                const RoleIcon = roleInfo.icon;
                                return RoleIcon ? <RoleIcon className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />;
                              })()}
                              <span className="text-sm">{roleInfo.label}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((role) => {
                              const IconComponent = role.icon;
                              return (
                                <SelectItem key={role.value} value={role.value}>
                                  <div className="flex items-start gap-2">
                                    <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <div className="font-medium">{role.label}</div>
                                      <div className="text-xs text-muted-foreground max-w-[220px]">
                                        {role.description}
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {user._count.ownedCases} เคส
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(user.createdAt), "dd/MM/yyyy")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={(checked) =>
                              handleToggleActive(user.id, checked)
                            }
                          />
                          <span className="text-sm">
                            {user.isActive ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                ใช้งาน
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                                ปิดใช้งาน
                              </Badge>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(user.id, user.name)}
                          disabled={deleteUser.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
