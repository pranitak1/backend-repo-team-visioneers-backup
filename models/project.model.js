const { string } = require("joi");
const { default: mongoose } = require("mongoose");
const validDocTypes = ['image', 'document', 'video']; // Define your valid document types here

// Define Task schema
const taskSchema = new mongoose.Schema({
    taskName: { type: String },
    isActive: { type: Boolean, default: true },
    deactivatedAt: { type: Date },
    content: { type: String },
    assigneeUserID: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        username: { type: String},
        email: { type: String }
    }, // Reference to user
    dueDate: { type: Date },
    priority: { type: String },
    attachments:[{
       docType: {type: String, enum: validDocTypes},
       docName: {type: String},
       docKey: {type: String},
       docUrl: {type: String}
        }],
    comments: [{
        user: {
            _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
            username: { type: String},
            email: { type: String }
        },
        comment: { type: String }
    }],
    createdBy:{
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        username: { type: String},
        email: { type: String }
    }
    //status:{type:mongoose.Schema.Types.ObjectId,ref: 'Column'}
}, { timestamps: true });

// Define Column schema
const columnSchema = new mongoose.Schema({
    title: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    deactivatedAt: { type: Date },
    taskIds: [{ type: String}]
}, { timestamps: true });

module.exports = mongoose => {
    // Define Project schema
    const projectSchema = new mongoose.Schema({
        name: { type: String, required: true },
        description: String,
        imgKey: { type: String},
        imgUrl: { type: String},
        workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
        order: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Column' }],
        columns: [{ type: columnSchema}],
        tasks: [{ type: taskSchema }],
        isActive: { type: Boolean, default: true },
        deactivatedAt: { type: Date },
        creatorUserID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    }, { timestamps: true });

    projectSchema.method("toJSON", function () {
        const { __v, _id, ...object } = this.toObject();
        object.id = _id;
        return object;
    });

    const Project = mongoose.model('Project', projectSchema);
    return Project;
}
