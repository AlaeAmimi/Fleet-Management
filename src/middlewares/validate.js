function validate(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,   // report all errors, not just the first
            stripUnknown: true,  // silently remove fields we didn't define
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: "Données invalides",
                errors: error.details.map((d) => d.message),
            });
        }

        req.body = value;
        next();
    };
}

module.exports = validate;