"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "@/lib/firebase";
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, User, Mail, Brain, Calendar } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import type { UserProfile } from "@/lib/types";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
  });

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        setUserProfile(profile);
        setFormData({
          fullName: profile.fullName,
          email: profile.email,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !userProfile) return;

    setSaving(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: formData.fullName,
      });

      // Update Firestore document
      await updateDoc(doc(db, "users", user.uid), {
        fullName: formData.fullName,
        updatedAt: new Date(),
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      // Reload profile
      await loadUserProfile();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Profile Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Avatar Display */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Avatar</CardTitle>
              <CardDescription>
                Your personalized avatar based on your name
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <UserAvatar name={formData.fullName} size="lg" />
              <div>
                <p className="font-medium">{formData.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  Your avatar color and initials are automatically generated
                  from your name
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    value={formData.email}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* IQ Test Information */}
          <Card>
            <CardHeader>
              <CardTitle>IQ Assessment</CardTitle>
              <CardDescription>
                Your cognitive assessment information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Brain className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">IQ Score</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {userProfile.iqScore || "Not tested"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Calendar className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Last Test</p>
                    <p className="text-sm text-green-600">
                      {userProfile.lastTestDate
                        ? new Date(
                            userProfile.lastTestDate
                          ).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/iq-test")}
                className="w-full"
              >
                {userProfile.hasCompletedIQTest
                  ? "Retake IQ Test"
                  : "Take IQ Test"}
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Card>
            <CardContent className="pt-6">
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
