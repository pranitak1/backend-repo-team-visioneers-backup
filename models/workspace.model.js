const mongoose = require("mongoose");

module.exports = mongoose => {
    const workspaceSchema = new mongoose.Schema({
        name: { type: String, required: true, unique: true },
        description: { type: String },
        imgKey: { type: String, required: true},
        imgUrl: { type: String, required: true, default: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'},
        projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
        creatorUserID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Ensure required
        isActive: { type: Boolean, default: true },
        deactivatedAt: { type: Date },
        members: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            role: { type: String, enum: ['Admin', 'Member'], required: true },
            isActive: { type: Boolean, default: true },
            joinedAt: { type: Date, default: Date.now },
            deactivatedAt: { type: Date },
        }],
    }, { timestamps: true });

    workspaceSchema.method("toJSON", function () {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });

    workspaceSchema.methods.exitMember = function (userId) {
        const member = this.members.find(m => m.user.toString() === userId.toString());
        if (member) {
            member.isActive = false;
            member.deactivatedAt = new Date();
        }
        return this.save();
    };

    const Workspace = mongoose.model('Workspace', workspaceSchema);
    return Workspace;
};
