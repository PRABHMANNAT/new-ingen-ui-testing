export const themeClasses = {
  light: {
    app: "bg-[#F4EFE7] text-[#2A2520]",
    canvas: "bg-[#F7F2EA] text-[#2A2520]",
    grid:
      "bg-[linear-gradient(to_right,#DED4C733_1px,transparent_1px),linear-gradient(to_bottom,#DED4C733_1px,transparent_1px)]",
    gridOpacity: "opacity-35",
    sidebar: "bg-[#FBF7EF]/90 border-[#DED4C7]",
    card: "border-[#DED4C7] bg-[#FBF7EF] shadow-[0_18px_50px_rgba(42,37,32,0.06)]",
    cardMuted: "bg-[#EEE8DF]",
    row: "bg-[#FFFDF8]",
    text: "text-[#2A2520]",
    muted: "text-[#7A7168]",
    faint: "text-[#8A8177]",
    border: "border-[#DED4C7]",
    input: "bg-[#FFFDF8] border-[#DED4C7] text-[#2A2520] placeholder:text-[#B8AFA5]",
  },
  dark: {
    app: "bg-[#050505] text-white",
    canvas: "bg-[#050505] text-white",
    grid:
      "bg-[linear-gradient(to_right,#1A1A1A_1px,transparent_1px),linear-gradient(to_bottom,#1A1A1A_1px,transparent_1px)]",
    gridOpacity: "opacity-55",
    sidebar: "bg-[#101010]/92 border-[#242424]",
    card: "border-[#242424] bg-[#101010] shadow-[0_18px_50px_rgba(0,0,0,0.28)]",
    cardMuted: "bg-[#1C1C1C]",
    row: "bg-[#171717]",
    text: "text-white",
    muted: "text-[#A0A0A0]",
    faint: "text-[#777]",
    border: "border-[#242424]",
    input: "bg-[#171717] border-[#242424] text-white placeholder:text-[#666]",
  },
} as const

export type AppTheme = keyof typeof themeClasses
