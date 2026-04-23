
export function withValidation(schema) {
  return (handler) => async (req, res) => {
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true })
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      })
    }
    return handler(req, res)
  }
}