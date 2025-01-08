import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ComingSoon = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-neutral-50">
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-2 md:mb-4 text-neutral-100">
                Coming Soon
            </h1>
            <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 text-neutral-400 text-center px-4">
                We're working hard to bring you something amazing!
            </p>

            <Button
                onClick={() => navigate("/dashboard")}
                className="bg-arlink-bg-secondary-color text-neutral-50 border-neutral-800 border hover:bg-neutral-800"
            >
                Go to Dashboard
            </Button>
        </div>
    );
};

export default ComingSoon;
