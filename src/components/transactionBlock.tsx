import { Link } from "react-router-dom";

import { ExternalLink } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TransactionDialogProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    transactionId: string;
    onClose: () => void;
    title: string;
}

export function TransactionDialog({
    isOpen,
    setIsOpen,
    transactionId,
    onClose,
    title,
}: TransactionDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[600px] bg-neutral-950 border border-neutral-800">
                <DialogHeader>
                    <DialogTitle className="text-neutral-100 text-lg">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400 mt-">
                        <div className="pt-2 leading-relaxed">
                            This is the transaction Id
                            <br />
                            <strong className="text-white">
                                {transactionId}
                            </strong>
                            ,
                            <br />
                            you can view your progress here
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <div className="col-span-4 text-neutral-100">
                            <span className="text-xs">Link</span>
                            <div className="hover:underline pt-1 text-neutral-300">
                                <Link
                                    to={`https://www.ao.link/#/message/${transactionId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex text-sm hover:underline items-center gap-2 hover:text-neutral-100 transition-colors duration-200"
                                >
                                    Check to see the progress
                                    <ExternalLink className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="bg-neutral-800 text-neutral-100 border-neutral-700 hover:bg-neutral-700 hover:text-neutral-100"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
