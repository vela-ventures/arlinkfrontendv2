import { create } from "zustand";
import { Template } from "@/types";

interface TemplateStore {
    templates: Template[];
}

export const useTemplateStore = create<TemplateStore>(() => ({
    templates: [
        {
            id: "1",
            title: "Preact Test Template",
            description: "fastest react app",
            creator: "Arlink labs",
            image: "https://imgs.search.brave.com/yvNZskIt_yspS6CLhL4AbLnCjq94EE4P6ji2ooLZyUY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YTIuZGV2LnRvL2R5/bmFtaWMvaW1hZ2Uv/d2lkdGg9ODAwLGhl/aWdodD0sZml0PXNj/YWxlLWRvd24sZ3Jh/dml0eT1hdXRvLGZv/cm1hdD1hdXRvL2h0/dHBzOi8vZGV2LXRv/LXVwbG9hZHMuczMu/YW1hem9uYXdzLmNv/bS91cGxvYWRzL2Fy/dGljbGVzL3N6aXVw/NHMwbjB6c2w5a2hm/ZjFjLnBuZw",
            framework: "react",
            repoOwner: "DMZTdhruv",
            repoName: "awesome-preact",
            useCase: "ethereum",
        },
        {
            id: "2",
            title: "keizer invoicen",
            description:
                "keizer invoicen is a invoicen starter for keizerworks",
            creator: "keizerworks",
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQAFUs8tjezy1zhOvLw0dvXDrd476B3qnnexQ&s",
            framework: "react",
            useCase: "solana",
            repoOwner: "keizerworks",
            repoName: "invoicen",
        },
        {
            id: "3",
            title: "Vite Template",
            description: "Quick start your project with Vite",
            creator: "vite",
            image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTkprJTO6N5AbTg3ljMGrPOtka2DnAskIKoSw&s",
            framework: "vite",
            useCase: "ethereum",
            repoOwner: "keizerworks",
            repoName: "keizer-auth",
        },
    ],
}));
