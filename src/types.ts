export interface ImageAnalysis {
  bengali: string;
  english: string;
}

export interface PromptStyle {
  id: string;
  styleNameBn: string;
  prompt: string;
  explanationBn: string;
}

export interface CameraPrompt {
  movementBn: string;
  prompt: string;
  descriptionBn: string;
}

export interface NegativePrompt {
  prompt: string;
  explanationBn: string;
}

export interface AnimationPromptResult {
  imageAnalysis: ImageAnalysis;
  masterPrompt?: PromptStyle;
  prompts: PromptStyle[];
  cameraPrompts: CameraPrompt[];
  negativePrompt: NegativePrompt;
  tips: string[];
}

export type MotionSpeed = "low" | "medium" | "high";

export type StylePriority = "match" | "cinematic" | "anime" | "3d" | "creative" | "realistic";

export type TargetPlatform = "Runway Gen-3" | "Luma Dream Machine" | "Meta AI" | "Kling AI" | "Sora" | "Pika Labs" | "General";
