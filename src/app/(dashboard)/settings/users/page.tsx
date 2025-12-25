"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Shield, Mail, Calendar, RefreshCw, Users, Headphones, UserCog, Crown, Wrench } from "lucide-react";
import { format } from "date-fns";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-users";
import { LoadingScreen } from "@/components/ui/loading-screen";

const ROLES = [
  { 
    value: "CEO", 
    label: "CEO", 
    color: "bg-amber-500",
    icon: Crown,
    description: "ผู้ดูแลระบบสูงสุด - ดูรายงาน ตั้งค่าระบบ จัดการผู้ใช้ (สิทธิ์เต็ม)"
  },
  { 
    value: "MANAGER", 
    label: "Manager", 
    color: "bg-purple-500",
    icon: Users,
    description: "ดูภาพรวม/ดูแลทีม - ดูทุกเคส มอบหมายงาน ตรวจสอบ SLA"
  },
  { 
    value: "SUPPORT", 
    label: "Support", 
    color: "bg-blue-500",
    icon: Headphones,
    description: "รับเรื่อง/แจ้งลูกค้า - สร้างเคส ดูทุกเคส ปิดเคส"
  },
  { 
    value: "TECHNICIAN", 
    label: "Technician", 
    color: "bg-green-500",
    icon: Wrench,
    description: "คนแก้ปัญหา - ดูเฉพาะเคสตัวเอง แก้ไขปัญหา อัพเดทสถานะ"
  },
];

export default function UsersPage() {
  const { data: session } = useSession();
  const { data: users = [], isLoading, refetch, isFetching } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  // เฉพาะ CEO เท่านั้นที่แก้ไข Role ได้
  const canEditRole = session?.user?.role === "CEO";
  
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">จัดการผู้ใช้งาน</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            จัดการผู้ใช้งานและสิทธิ์การเข้าถึงระบบ
            {isFetching && (
              <RefreshCw className="h-3 w-3 animate-spin" />
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">รีเฟรช</span>
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">เพิ่มผู้ใช้</span>
                <span className="sm:hidden">เพิ่ม</span>
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
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const selectedRole = ROLES.find(r => r.value === formData.role);
                              const IconComponent = selectedRole?.icon || Shield;
                              return (
                                <>
                                  <div className={`h-6 w-6 rounded-full ${selectedRole?.color} flex items-center justify-center text-white`}>
                                    <IconComponent className="h-3.5 w-3.5" />
                                  </div>
                                  <span>{selectedRole?.label}</span>
                                </>
                              );
                            })()}
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="w-[350px]">
                        {ROLES.map((role) => {
                          const IconComponent = role.icon;
                          const isSelected = role.value === formData.role;
                          return (
                            <SelectItem key={role.value} value={role.value} className="py-3">
                              <div className="flex items-start gap-3">
                                <div className={`h-9 w-9 rounded-full ${role.color} flex items-center justify-center text-white flex-shrink-0`}>
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{role.label}</span>
                                    {isSelected && (
                                      <Badge variant="secondary" className="text-xs">เลือก</Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    {role.description}
                                  </p>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
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
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">ผู้ใช้ทั้งหมด</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">ใช้งานอยู่</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {users.filter((u) => u.isActive).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Admin</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {users.filter((u) => u.role === "CEO").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="text-xs">Support</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {users.filter((u) => u.role === "SUPPORT").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List - Card-based for better mobile */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">รายการผู้ใช้งาน</h2>
          
          {users.map((user) => {
            const roleInfo = getRoleInfo(user.role);
            const RoleIcon = roleInfo.icon || Shield;
            return (
              <Card key={user.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div
                      className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full ${roleInfo.color} flex items-center justify-center text-white font-semibold shrink-0`}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium truncate">{user.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={(checked) =>
                              handleToggleActive(user.id, checked)
                            }
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(user.id, user.name)}
                            disabled={deleteUser.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {canEditRole ? (
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                            disabled={updateUser.isPending}
                          >
                            <SelectTrigger className="w-[120px] h-7 text-xs">
                              <SelectValue>
                                <div className="flex items-center gap-1.5">
                                  <RoleIcon className="h-3 w-3" />
                                  <span>{roleInfo.label}</span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="w-[280px]">
                              {ROLES.map((role) => {
                                const IconComponent = role.icon;
                                return (
                                  <SelectItem key={role.value} value={role.value} className="py-2">
                                    <div className="flex items-start gap-2">
                                      <div className={`h-6 w-6 rounded-full ${role.color} flex items-center justify-center text-white shrink-0`}>
                                        <IconComponent className="h-3 w-3" />
                                      </div>
                                      <div>
                                        <span className="font-medium text-sm">{role.label}</span>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                          {role.description}
                                        </p>
                                      </div>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <RoleIcon className="h-3 w-3" />
                            {roleInfo.label}
                          </Badge>
                        )}
                        
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{user._count.ownedCases} เคส</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(user.createdAt), "dd/MM/yy")}
                        </span>
                        
                        {user.isActive ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                            ใช้งาน
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">
                            ปิดใช้งาน
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
    </div>
  );
}
