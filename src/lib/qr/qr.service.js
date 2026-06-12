import { renderQrPattern } from "./qr-engine";
import { validateQrPattern } from "./qr-validator";

export const QrService = {
  validatePattern(pattern) {
    return validateQrPattern(pattern);
  },

  generate(payload) {
    const { pattern, seqLength = 4, values = {} } = payload || {};
    return renderQrPattern(pattern, values, seqLength);
  },
};

export default QrService;
