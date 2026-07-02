import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, User, Store, Briefcase, Users } from "lucide-react";

const stepsMap: Record<string, { title: string; steps: string[] }> = {
  CUSTOMER: { title: "Welcome, Customer!", steps: ["Profile Setup", "Address Setup", "Explore Marketplace"] },
  VENDOR: { title: "Welcome, Vendor!", steps: ["Profile", "Business Verification", "Store Setup", "Product Listing"] },
  SERVICE_PROVIDER: { title: "Welcome, Service Provider!", steps: ["Profile", "Verification", "Service Setup"] },
  FRANCHISE_PARTNER: { title: "Welcome, Franchise Partner!", steps: ["Application Review", "Verification", "Approval Process"] },
  // default for others
};

const OnboardingModal = ({ role, onClose }: { role: string; onClose: () => void }) => {
  const data = stepsMap[role] || { title: "Welcome to ApexBee!", steps: ["Complete Profile", "Explore Dashboard", "Start Growing"] };
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">{data.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {data.steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3 border-b pb-2">
              <CheckCircle className="w-5 h-5 text-accent" />
              <span>{step}</span>
            </div>
          ))}
        </div>
        <Button onClick={onClose} className="w-full bg-accent">Get Started</Button>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;