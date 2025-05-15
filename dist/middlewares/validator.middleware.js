"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReqValidator;
const zod_1 = require("zod");
// Middleware to validate request body against Zod schema
function ReqValidator(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (err) {
            // Handle ZodError specifically
            if (err instanceof zod_1.ZodError) {
                // Extract error messages from ZodError
                // Map ZodError messages to a more user-friendly format
                const message = err.errors.map((issue) => ({
                    message: `${issue.message}`
                }));
                res.status(500).send({
                    message: "NG",
                    details: message
                });
                res.end();
            }
            else {
                // Handle other errors
                next(err);
            }
        }
    };
}
