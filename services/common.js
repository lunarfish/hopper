module.exports = {
  template_data: function(req) {
    common_data = {
      title: "Hoppers: Federated project management",
      crumbs: [
        { url: "/", name: "Home" }
      ]
    }
    if (req.hasOwnProperty("user")) {
      console.log("USER:");
      console.log(req.user.provider_id);
      common_data.user = req.user;
    }
    return common_data;
  }
}
