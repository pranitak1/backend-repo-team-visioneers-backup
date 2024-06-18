const mongoose = require("mongoose");
const Schema = mongoose.Schema;

module.exports = (mongoose) => {
  var schema = new mongoose.Schema(
    {
      username: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      password: {
        type: String,
        required: true,
      },
      imgKey: {
        // Add imgKey field with default value
        type: String,
        required: true,
        default: function () {
          return `1717583169603-user-img.jpg`;
        },
      },
      imgUrl: {
        // Add imgUrl field with default value
        type: String,
        default: function () {
          return `https://taskwiseai-s3.s3.ap-south-1.amazonaws.com/1717583169603-user-img.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAW3MEDJLIRCUPEROY%2F20240605%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20240605T102611Z&X-Amz-Expires=172800&X-Amz-Signature=129b61671f6458297764a50be7cbeaea20f58858cce32a17bec707e7a71dfc1c&X-Amz-SignedHeaders=host`;
        },
      },
      // Added title field
      title: {
        type: String,
        default: "User",
      },
      resetCode: {
        type: String,
      },
      resetCodeExpiry: {
        type: Date,
      },
    },
    { timestamps: true }
  );
  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const User = mongoose.model("User", schema); // Simplify the export
  return User;
};
