import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body size limits for holding uploaded images in base64 format safely
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

/**
 * Lazy-initializes and validates the Gemini Client.
 * Throws a clear error if the API key is not supplied.
 */
function getGeminiClient(customKey?: string) {
  const apiKey = customKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY পাওয়া যায়নি। অনুগ্রহ করে আপনার নিজস্ব API কী অ্যাপের সেটিংস থেকে যুক্ত করুন অথবা AI Studio Secrets প্যানেলে সেটআপ করুন।");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is fully responsive." });
});

// API endpoint to analyze a base64 image and generate animation prompts
app.post("/api/generate-prompt", async (req, res) => {
  try {
    const { 
      imageBase64, 
      mimeType, 
      motionSpeed = "medium", 
      stylePriority = "match", 
      targetPlatform = "Runway Gen-3", 
      customInstructions = "" 
    } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ 
        error: "অনুগ্রহ করে একটি ইমেজ আপলোড করুন।" 
      });
    }

    const customKey = req.headers["x-gemini-key"] as string || "";
    const ai = getGeminiClient(customKey);

    // Mapping values to clear textual guidance
    const speedLabels: Record<string, string> = {
      low: "Slow and steady kinetic motion, gentle changes, subtle floating, eye blinking, slow pan",
      medium: "Natural cinematic motion, standard frame rate feel, organic wind, panning camera shot",
      high: "Highly dynamic action pacing, cinematic hyperlapse or high-speed motion, splash or sudden shifts"
    };

    const targetDescription = targetPlatform === "General" 
      ? "compatible across Runway Gen-3 Alpha, Luma Dream Machine, Kling AI, Pika Labs, and OpenAI Sora" 
      : `specifically optimized for ${targetPlatform}`;

    const promptRequest = `You are an elite Creative Director and AI Video Animation Prompt Engineer.
We want to animate the provided static image using state-of-the-art text-to-video or image-to-video generation platforms.

Here is the user's customized input and settings:
1. Target Platform: ${targetPlatform} (${targetDescription})
2. Motion Speed (এনিমেশনের গতি): ${motionSpeed} (${speedLabels[motionSpeed] || speedLabels["medium"]})
3. Visual Style Priority (প্রধান স্টাইল): ${stylePriority}
4. Custom Animation Instructions from User (ইউজার স্পেশাল কমান্ড/ধারণা - can be Bengali or English): "${customInstructions || 'কোন অতিরিক্ত নির্দেশ নেই'}"

=== CRITICAL ANIMATION ENGINEERING DIRECTIVES ===

1. STRICT ART STYLE AND COLOR PRESERVATION (স্টাইল ও কালার ১০০% বজায় রাখা):
   - The original visual medium, color palette, lighting, textures, and artist's touch MUST be preserved exactly (image-to-video fidelity).
   - DO NOT morph, degrade, cartoonize, or alter the color temperature of the image (e.g., do NOT turn it into black-and-white, dark/gloomy, or different hues unless requested). If it's a hand-painted scene, keep it matching the hand-painted brush style perfectly.
   - Specify in each English prompt that the original artwork's colors, textures, and lighting should remain completely unchanged.

2. DETECT & ANIMATE ALL CONSTITUENT ELEMENTS WITH NATURAL, BALANCED PHYSICS (স্বাভাবিক ও বাস্তবসম্মত স্বাভাবিক গতি):
   - Every single animation speed must feel highly natural and organic. Avoid unrealistic high speeds, warping, or extreme kinetic distortion unless high action is specifically demanded.
   - Water/Rivers/Lakes (নদী/পানি): Animate with realistic gentle flowing fluid currents, liquid ripples reflecting ambient light, and shoreline water movement.
   - Trees/Greenery/Leaves (গাছের পাতা/বন): Animate with subtle organic swaying in the gentle breeze, flickering sunlight through foliage, and natural plant dynamics.
   - Boats/Vehicles (নৌকা/যানবাহন): Animate with gentle rocking physics, floating tilts, and forward motion matching user instructions.
   - Living Entities (মানুষ/প্রাণী): Animate with lifelike minor gestures, breathing, blinking, hair micro-movements, or natural postures.
   - Sky/Mist (আকাশ/কুয়াশা): Animate with slow ambient drifting.

3. INTELLIGENT BENGALI EXPANSION OF CUSTOM DIRECTIONS (অল্প কথায় অনেক কিছু বুঝে নেয়া):
   - Carefully read the user's custom instructions (even if very short, e.g., "নৌকা চলতেচলতে সামনের দিকে চলবে").
   - Intelligently expand this to create a breathtaking professional sequence: describe the boat moving forward smoothly along the river, pushing water ripples outward to create a gentle wake, while the background trees sway softly, and the river water flows synchronically under warm ambient lighting.

Analyze the layout, composition, lighting, style, objects, and emotional temperature of the provided image.
Then, generate exactly 5 distinct styles of animation prompts. Each prompt MUST be in English because text-to-video models are trained on English. For each style, provide a descriptive Bengali title and a comprehensive Bengali explanation of what this motion will look like so Bengali users can learn.

Your output must be returned STRICTLY as a JSON object matching this TypeScript structure exactly:

{
  "imageAnalysis": {
    "bengali": "ইমেজের সাবজেক্ট, কালার প্যালেট, লাইটিং এবং পরিবেশের বাংলা বিশ্লেষণ...",
    "english": "In-depth visual context summary, focus elements, aesthetic style, and mood in English..."
  },
  "masterPrompt": {
    "id": "master_prompt",
    "styleNameBn": "প্রধান এনিমেশন প্রম্পট (Master Video Animation Prompt)",
    "prompt": "An ultimate, highly detailed cohesive image-to-video English prompt for generative models. The prompt must strictly follow: 1) Keep the original artwork's colors, lighting, textures, style, and visual medium 100% perfectly intact without any changes or black/white conversion. 2) Naturally animate river/water body with gentle flowing fluid currents and reflecting ripples. 3) Organic swaying of trees and leafy bushes in the breeze. 4) Rocking or traveling motion of boats exactly matching the user's custom instructions (e.g. 'the boat smoothly slides forward through the river' if the user requested 'নৌকা চলতেচলতে সামনের দিকে চলবে'). 5) Tiny subtle human/living figure movements like breathing or posture sways. Clear, photorealistic cinematic movement.",
    "explanationBn": "বাংলায় চমৎকার ব্যাখ্যা যা দেখাবে এনিমেশনে কীভাবে নৌকা, পানি, গাছ এবং পরিবেশের সব উপাদান ১০০% অরিজিনাল কালার ও স্টাইল বজায় রেখে একসাথে নিখুঁতভাবে সচল ও জীবন্ত হয়ে উঠবে।"
  },
  "prompts": [
    {
      "id": "style_cinematic",
      "styleNameBn": "সিনেমাটিক ক্যামেরা জিরো-গ্র্যাভিটি পান (Cinematic Slow Pan)",
      "prompt": "Highly detailed image-to-video English prompt. E.g. 'Slow cinematic 3D dolly zoom, soft photorealistic lighting, [action matching custom instructions], keeping original colors, aesthetic textures and details intact without any style alteration, smooth 4k animation.' Ensure prompt includes specific subject description based on the image.",
      "explanationBn": "বাংলায় চমৎকার ব্যাখ্যা যা দেখাবে এনিমেশনে ক্যামেরা কীভাবে ঢুকবে এবং আলোর গতি কেমন হবে..."
    },
    {
      "id": "style_environmental_loop",
      "styleNameBn": "লুপযোগ্য পরিবেশ গতিশীলতা (Subtle Seamless Loop)",
      "prompt": "Vivid English prompt focusing on continuous minor flows like rotating water ripples, slow wind shaking leaves, glowing particles floating in the background, steam rising, seamless loop feeling, preserving exact lighting and original textures perfectly.",
      "explanationBn": "বাংলায় ব্যাখ্যা..."
    },
    {
      "id": "style_anime_vibrant",
      "styleNameBn": "অ্যানিমে ও পেইন্টারলি ফ্লুইড গতি (Anime & Stylized Motion)",
      "prompt": "Vivid English prompt emphasizing stylized colorful animations, hand-drawn anime particles, watercolor washes moving, dynamic light bloom, emotional expressions, matching the original aesthetic palette 100%.",
      "explanationBn": "বাংলায় ব্যাখ্যা..."
    },
    {
      "id": "style_dynamic_action",
      "styleNameBn": "হাই স্পিড ড্রামাটিক অ্যাকশন (High Energy Action)",
      "prompt": "High speed animation English prompt. 'Dynamic fast-paced motion, steady camera tracking, dramatic wind gusts, debris or energy sparks flying, swift camera tilt, action-packed cinematic sequence, keeping original visual integrity completely pristine.' Include specific details matching user instructions if any.",
      "explanationBn": "বাংলায় ব্যাখ্যা..."
    },
    {
      "id": "style_surreal_magic",
      "styleNameBn": "কাল্পনিক ও ম্যাজিকাল রূপান্তর (Fantasy & Surreal Morph)",
      "prompt": "Fantasy transition prompt. Magic dust swirling, shimmering light rays shifting colors, objects slightly hovering, mystical atmosphere, dreamy glowing haze but zero breakdown of original structural layout.",
      "explanationBn": "বাংলায় ব্যাখ্যা..."
    }
  ],
  "cameraPrompts": [
    {
      "movementBn": "Dolly In & Slow Zoom (ডলি ইন এবং স্লো জুম)",
      "prompt": "Camera slowly dollies in, tracking forward smoothly towards the subject, maintaining crisp focus, shallow depth of field, background compression.",
      "descriptionBn": "ক্যামেরা আস্তে আস্তে সাবজেক্টের দিকে এগিয়ে যাবে এবং ব্যাকগ্রাউন্ড হালকা ঝাপসা হবে।"
    },
    {
      "movementBn": "Orbital Circular Pan (অরবিটাল বৃত্তাকার প্যান)",
      "prompt": "360-degree perfect orbital camera pan around the focal point, catching high-contrast volumetric lighting angles, cinematic parallax background shift.",
      "descriptionBn": "ক্যামেরাটি বৃত্তাকারে সাবজেক্টের চারিদিকের ৩৬০ ডিগ্রি ভিউ দেখাবে।"
    }
  ],
  "negativePrompt": {
    "prompt": "color changes, black and white conversion, monochrome, style degradation, quality loss, distorted limbs, morphing faces, ugly noise texturing, watermark, text overlays, fast-cut transitions, sudden color flashes, structural breakdown",
    "explanationBn": "এই নেগেটিভ প্রম্পটগুলো আপনার ভিডিওর অযাচিত রূপান্তর, ফেস পরিবর্তন এবং অপ্রীতিকর ঝাঁকুনি দূর করবে।"
  },
  "tips": [
    "কপিআউট করুন এবং Runway বা Luma-তে ইমেজ আপলোড করার পর এই প্রম্পটটি 'Text Prompt' বক্সে পেস্ট করুন।",
    "ইউজারের কাস্টম নির্দেশকে প্রাধান্য দেওয়া হয়েছে। যদি ফলাফল আরও নির্দিষ্ট চান, 'Custom Instructions' বক্সে বাংলায় আরও ডিটেইলস লিখুন।",
    "একটি ভালো মানের এনিমেশন লুপের জন্য Motion Value সাধারণত মাঝারি (৫ থেকে ৭) রাখা আদর্শ।"
  ]
}

Only return a JSON object. Ensure the prompts are deeply rooted in the details of the uploaded image. If there are people, animals, objects, trees, explain how they interact with wind, water ripples, camera movement, and physical forces. Ensure to keep the original visual medium, colors, style, and tone intact and state this clearly in every single prompt option.`;

    // Extract raw base64 and mime type
    let base64DataOnly = imageBase64;
    let actualMimeType = mimeType || "image/png";

    if (imageBase64.includes(";base64,")) {
      const parts = imageBase64.split(";base64,");
      const header = parts[0];
      base64DataOnly = parts[1];
      if (header.includes("data:")) {
        actualMimeType = header.replace("data:", "").split(";")[0];
      }
    }

    const imagePart = {
      inlineData: {
        mimeType: actualMimeType,
        data: base64DataOnly,
      },
    };

    const textPart = {
      text: promptRequest,
    };

    // Run the generation using gemini-3.5-flash which has native JSON capability
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("AI সার্ভিস থেকে কোনো উত্তর পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।");
    }

    // Clean up markdown backticks if any
    let cleanedText = resultText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.substring(7);
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.substring(3);
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }
    cleanedText = cleanedText.trim();

    const parsedResult = JSON.parse(cleanedText);
    res.json(parsedResult);

  } catch (error: any) {
    console.error("error during prompt generation:", error);
    res.status(500).json({ 
      error: error.message || "প্রম্পট জেনারেট করার সময় একটি অভ্যন্তরীণ ডোমেন সমস্যা ঘটেছে।" 
    });
  }
});

// Configure Vite integration dynamically based on production or development mode
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with static file assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
