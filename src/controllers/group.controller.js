const { Group } = require("../models");

exports.createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    const userId = req.user.id;
    if (!name || !members) {
      req.flash("All credentials are required");
      return res.redirect("back");
    }
    const group = await Group.create({
      name,
      createdBy: userId,
    });

    await GroupMember.create({
      groupId: group.id,
      userId,
    });

    for (let m of members) {
      await GroupMember.create({
        groupId: group.id,
        userId: m,
      });
    }

    req.flash("success", "group created sucessfully");

    res.json(group);
  } catch (error) {
    console.log(error, "error in create group controller");
    req.flash("error", "Something went wrong");
  }
};

exports.getGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = await Group.findAll({
      include: [
        {
          model: GroupMember,
          where: { userId },
        },
      ],
    });
    res.json(groups);
  } catch (error) {
    console.log(error);
    req.flash("error", "Something went wrong");
  }
};

exports.getGroupChatHistory = async(req, res) => {
    const {groupId} = req.params;

    const messages = await Messages.findAll({
        where: {groupId},
        include: [{ model: Reaction }],
        order: [["createdAt", "ASC"]]
    })
} 
