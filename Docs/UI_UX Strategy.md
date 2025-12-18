# **AFP UGC UI/UX Specification**

## **Introduction**

This document defines the user experience, information architecture, and visual design specifications for "AFP UGC". It translates the functional requirements into a concrete design guide for the frontend development team.

* **Link to PRD:** docs/prd.md  
* **Design Philosophy:** "Professional Precision"—Figma meets Stripe. Powerful tools trusted by professionals who value clarity over decoration.

## **1\. Strategic Foundation & UX Goals**

### **1.1 User Psychology Profile**

**Primary User:** The Efficiency-Driven Entrepreneur (Dropshipper).

* **Cognitive State:** Task-focused, time-scarce, skeptical of "black box" automation.  
* **Primary Fear:** Wasting money on low-quality output.  
* **Primary Desire:** Predictable, controllable results.  
* **Decision Framework:** "Show me the value quickly, then let me verify before I commit."

**Key Psychological Principles:**

* **Loss Aversion:** Users fear wasting credits more than gaining videos. (Implication: Explicitly label cost *before* action).  
* **Control Paradox:** Users want automation but need the *feeling* of control to trust the system. (Implication: The Script Review step).  
* **Peak-End Rule:** The Script Review moment and final video download are critical emotional peaks.

### **1.2 Core Design Pillars**

1. **Transparency:** Every action's cost and consequence is visible before commitment.  
2. **Reversibility:** Users can always go back and edit before spending credits.  
3. **Feedback Density:** Rich, immediate feedback (toasts, badges) for every async action.  
4. **Respectful Automation:** AI does the heavy lifting, but humans make the final call.

## **2\. Visual Identity System**

### **2.1 Color Palette (Dark Mode Default)**

* **Backgrounds:**  
  * bg-layer-1: \#0A0E14 (Deep charcoal) \- Reduces eye strain, signals premium.  
  * bg-layer-2: \#161B22 (Elevated surfaces) \- Cards, modals.  
  * bg-layer-3: \#1F2937 (Interactive hover states).  
* **Accents:**  
  * primary: \#6366F1 (Electric Indigo) \- **Trust \+ Innovation**. Usage: "Generate Video", Wizard Progress.  
  * success: \#10B981 (Emerald Green) \- **Value/Money Well Spent**. Usage: "Video Ready", Credit Purchase.  
  * warning: \#F59E0B (Amber) \- **Caution without Alarm**. Usage: Low credits, validations.  
  * destructive: \#EF4444 (Crimson) \- **Critical**. Usage: Failed generation, destructive actions.  
  * neutral: \#64748B (Slate Gray) \- Metadata, disabled states.

### **2.2 Typography**

* **Headings/UI:** **Inter**. Designed for screen legibility.  
  * *H1:* 32px, W600.  
  * *Body:* 16px, W400, Line-height 1.6.  
* **Data/Credits:** **JetBrains Mono**. Signals precision; makes numbers scannable.

## **3\. Information Architecture (IA)**

### **Mental Model**

"Studio (Create) \+ Library (Manage) \+ Control Room (Admin)"

### **Site Map**

graph TD  
    Auth\[Login / Sign Up\] \--\> Library\[Library (Home)\]  
    Library \--\> Wizard\[Studio Wizard\]  
    Wizard \--\> Step1\[Input: Amazon/Manual\]  
    Step1 \--\> Step2\[Review: Script & Images\]  
    Step2 \--\> Step3\[Processing State\]  
    Step3 \--\> Library  
    Library \--\> VideoDetail\[Video Player / Download\]  
    Library \--\> Billing\[Billing / Credits\]  
    Library \--\> Settings\[Account Settings\]  
    Library \--\> Admin\[Admin Dashboard\]

## **4\. User Flows & Interaction Design**

### **4.1 The Wizard Flow (Core Creation)**

**Philosophy:** Linear, step-by-step, zero distraction.

* **Step 1: Input (Low Friction)**  
  * **UI:** Large, forgiving input field for Amazon URL. Tab toggle for "Manual Input".  
  * **Interaction:** Paste URL \-\> Auto-fetch metadata with skeleton loader \-\> "Continue" button enables upon success.  
* **Step 2: Script Review (High Control \- The Trust Moment)**  
  * **Layout:** Split Screen.  
    * *Left (Reference \- Locked):* Product Title, Description, Image Grid (Selectable).  
    * *Right (Editor \- Interactive):* Editable Textarea for AI Script with live character count.  
  * **Key Interaction:** The spatial separation of "what we found" vs "what you create" reinforces control.  
  * **Primary CTA:** "Generate Video • \-1 Credit" (Electric Indigo, large). Explicit cost removes surprise.  
* **Step 3: Processing (Anxiety Reduction)**  
  * **UI:** Animated progress indicator (pseudo-stages: "Analyzing script... Composing scenes... Rendering").  
  * **Psychology:** Breaking the black box into stages builds patience (Zeigarnik effect).  
  * **Action:** "Notify me via Email" or "Go to Library".

### **4.2 The Library (Default Landing)**

* **Layout:** 4-column grid (Desktop), Single column (Mobile).  
* **Empty State:** Illustration \+ "Your video library is empty—let's create something" \+ Large CTA.  
* **Card States:**  
  * *Processing:* Blurred thumbnail \+ Amber pulsing dot \+ "Generating...".  
  * *Ready:* Clear thumbnail (First Frame) \+ Green checkmark. Hover shows "Play".  
  * *Failed:* Grayscale \+ Red badge. "Retry" button (refunded).

### **4.3 Admin Console (Operations)**

* **Vibe:** Dense, data-rich, table-centric. "Operations Console".  
* **User Table:** Sortable columns (Email, Credits, Spend). Quick-action row for "Refund/Add Credits".  
* **Moderation Feed:** Grid of recent videos with "Ban User" destructive actions.

## **5\. Component Specifications**

### **The Credit Widget (Omnipresent Trust Anchor)**

* **Location:** Top-right global header. Always visible.  
* **Visual:** Pill shape, JetBrains Mono font.  
* **States:**  
  * *Sufficient:* Neutral color.  
  * *Low (\<5):* Amber border glow \+ warning dot.  
  * *Zero:* Amber background \+ "Add Credits" CTA.

### **Script Editor**

* **Right Column:** Large textarea (min 8 lines).  
* **Counters:** Live character count (amber if \<50 or \>500).  
* **Actions:** "Regenerate Script" (Secondary), "Select Images" (Primary).

### **Image Selection Interface**

* **Grid:** Thumbnail grid.  
* **Selection:** Click to toggle. Selected images get Electric Indigo border.  
* **Constraints:** Max 5 images. Feedback: "Select at least 1 image to continue".

### **Video Player Modal**

* **Layout:** Portrait video centered (on desktop black backdrop).  
* **Controls:** Play/Pause, Scrubber.  
* **Sidebar/Bottom:**  
  * *Metadata:* Script used, Date generated.  
  * *Primary Action:* "Download MP4" (Primary Color).

## **6\. Responsiveness Strategy**

* **Desktop (1280px+):** Full split-screen wizard. 4-column library grid.  
* **Tablet (1024px):** Script Review becomes single-column (Source collapses into accordion).  
* **Mobile (\<768px):**  
  * *Wizard:* Stacked layout. Script editor reduces to 4 visible lines.  
  * *Library:* Single-column list view.  
  * *Philosophy:* Optimized for Status Checking and Previewing.

## **7\. Animation & Motion Principles**

* **Allowed:**  
  * State Transitions: Fade \+ slight scale on hover (120ms).  
  * Progress Feedback: Shimmer on loading.  
  * Confirmation: Success checkmark bounce.  
* **Forbidden:** Auto-playing carousels, Parallax, Elaborate page transitions.  
* **Processing Animation:** Isometric blocks assembling. Timing: 8-15s per stage.

## **8\. Accessibility (AX) Requirements**

* **Contrast:** All text meets WCAG AA (4.5:1) on dark backgrounds.  
* **Keyboard:** Full wizard navigation via Tab/Enter. Focus indicators: 2px Electric Indigo.  
* **Motion:** prefers-reduced-motion disables isometric animations.

## **9\. Brand Voice & Microcopy**

* **Tone:** Professional, Confident, Transparent. Not cutesy.  
* **Examples:**  
  * *Good:* "Generate Video • 1 Credit", "Video ready\! Download now."  
  * *Bad:* "Make Magic Happen\! ✨", "Woohoo\! Your vid is lit\! 🔥"

## **10\. Success Metrics**

* **Wizard Completion Rate:** Target \>65%.  
* **Script Edit Rate:** Target 70-85% (Validates "Review Step" value).  
* **Retry After Failure:** Target \>60% (Trust retention).

## **Change Log**

| Change | Date | Version | Description | Author |
| :---- | :---- | :---- | :---- | :---- |
| Strategy Integration | 2025-05-20 | 2.0 | Integrated full UI/UX Strategy Document | Design Architect |
| Initial Draft | 2025-05-20 | 1.0 | Strategy adoption and structural definition | Design Architect |

