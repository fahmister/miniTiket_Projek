"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReqValidatorEvent = ReqValidatorEvent;
const zod_1 = require("zod");
function ReqValidatorEvent(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    message: "Validation error",
                    details: error.errors
                });
            }
            else {
                next(error);
            }
        }
    };
}
