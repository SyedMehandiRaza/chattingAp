const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: true,
      stripUnknown: true,
    });

    if (error) {
      console.log("------------------ validate schema" , error.details[0].message)
      req.flash("error", error.details[0].message);
      return res.redirect("back");
    }
    // console.log(value)
    req[property] = value;
    // console.log()
    next();
  };
};

module.exports = validate;
