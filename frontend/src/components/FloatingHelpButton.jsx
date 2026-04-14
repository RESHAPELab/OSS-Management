import Fab from "@mui/material/Fab";
import Tooltip from "@mui/material/Tooltip";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

/** MCQ quest structure guide for instructors (opens GitHub in a new tab). */
export const MCQ_QUEST_HELP_DOC_URL =
  "https://github.com/RESHAPELab/OSS-Management/blob/misan/backend/docs/mcq-quest-structure.md";

/** Same deep orange as ClassView dashboard stat card & GenerateJson orangeSwitch / generateHintButton */
const SIGNATURE_ORANGE = "#ff5722";
const SIGNATURE_ORANGE_HOVER = "#e64a19";

export default function FloatingHelpButton() {
  return (
    <Tooltip
      title="MCQ quest structure & documentation (opens in new tab)"
      placement="left"
    >
      <Fab
        component="a"
        href={MCQ_QUEST_HELP_DOC_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open MCQ quest documentation in a new tab"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: (theme) => theme.zIndex.tooltip + 1,
          bgcolor: SIGNATURE_ORANGE,
          color: "#fff",
          boxShadow: 3,
          "&:hover": {
            bgcolor: SIGNATURE_ORANGE_HOVER,
          },
        }}
        size="medium"
      >
        <HelpOutlineIcon />
      </Fab>
    </Tooltip>
  );
}
