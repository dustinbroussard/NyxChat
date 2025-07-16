
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "./button";

interface BackToChatButtonProps {
  className?: string;
  label?: string;
}

export const BackToChatButton: React.FC<BackToChatButtonProps> = ({
  className = "",
  label = "Back to Chat"
}) => {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate("/")}
      className={`flex items-center gap-2 mb-4 ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
};
