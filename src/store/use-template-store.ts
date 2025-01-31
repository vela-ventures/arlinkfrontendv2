import { create } from "zustand";
import { Template, TemplateDashboard } from "@/types";

interface TemplateStore {
    templates: TemplateDashboard[];
    setTemplates: (templates: TemplateDashboard[]) => void;
}

export const useTemplateStore = create<TemplateStore>((set) => ({
    templates: [],
    setTemplates: (templates: TemplateDashboard[]) => {
        set({ templates });
    },
}));
