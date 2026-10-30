import siteConfig from "@site";
import { codeTemplate, formatCode } from "@/lib/questions/codes";

export function codeExample(): string {
  return formatCode(codeTemplate(siteConfig.questionCodes.format, siteConfig.questionCodes.defaultPrefix.MATH, "ALG"), 1, siteConfig.questionCodes.padding);
}
