const mongoose = require('mongoose')
const mongooseSlugPlugin = require('mongoose-slug-plugin')
const {
    EventTypes,
    ReviewingMethods,
    OverallReviewingMethods,
} = require('@hackjunction/shared')
// const AddressSchema = require('@hackjunction/shared/schemas/Address')
const ChallengeSchema = require('@hackjunction/shared/schemas/Challenge')
const CloudinaryImageSchema = require('@hackjunction/shared/schemas/CloudinaryImage')
const RegistrationSectionSchema = require('@hackjunction/shared/schemas/RegistrationSection')
const TrackSchema = require('@hackjunction/shared/schemas/Track')
const PartnerSchema = require('@hackjunction/shared/schemas/Partner')
const TravelGrantConfigSchema = require('@hackjunction/shared/schemas/TravelGrantConfig')
const UserDetailsConfigSchema = require('@hackjunction/shared/schemas/UserDetailsConfig')
const EventTagSchema = require('@hackjunction/shared/schemas/EventTag')
const RegistrationConfigSchema = require('@hackjunction/shared/schemas/RegistrationConfig')
const AddressSchema = require('@hackjunction/shared/schemas/Address')
const allowPublishPlugin = require('../../common/plugins/allowPublish')
const updateAllowedPlugin = require('../../common/plugins/updateAllowed')
const uploadHelper = require('../../modules/upload/helper')

const EventSchema = new mongoose.Schema({
    /** Event info */
    name: {
        type: String,
        required: true,
        requiredForPublish: true,
        maxLength: 100,
        trim: true,
    },
    description: {
        type: String,
        requiredForPublish: true,
        maxLength: 5000,
        trim: true,
    },
    /** Times */
    timezone: {
        type: String,
        requiredForPublish: true,
    },
    registrationStartTime: {
        type: Date,
        requiredForPublish: true,
    },
    registrationEndTime: {
        type: Date,
        requiredForPublish: true,
    },
    startTime: {
        type: Date,
        requiredForPublish: true,
    },
    endTime: {
        type: Date,
        requiredForPublish: true,
    },
    submissionsStartTime: {
        type: Date,
        requiredForPublish: true,
    },
    submissionsEndTime: {
        type: Date,
        requiredForPublish: true,
    },
    reviewingStartTime: {
        type: Date,
        requiredForPublish: true,
    },
    reviewingEndTime: {
        type: Date,
        requiredForPublish: true,
    },
    /** Event customisation */
    coverImage: CloudinaryImageSchema.mongoose,
    logo: CloudinaryImageSchema.mongoose,
    /** Event configuration */
    eventType: {
        type: String,
        enum: Object.keys(EventTypes),
        required: true,
        default: EventTypes.online.id,
    },
    eventLocation: {
        type: AddressSchema.mongoose,
        required: [
            function() {
                return this.eventType === EventTypes.physical.id
            },
            `is required for physical events`,
        ],
    },
    partners: {
        type: [PartnerSchema.mongoose],
        default: [],
        validate: [
            function(val) {
                return Array.isArray(val)
            },
            'must have at least one item if tracks are enabled',
        ],
        required: false,
    },
    tracksEnabled: false,
    tracks: {
        type: [TrackSchema.mongoose],
        default: [],
        validate: [
            function(val) {
                if (this.tracksEnabled) {
                    return val.length > 0
                }
                return true
            },
            'must have at least one item if tracks are enabled',
        ],
        required: [
            function() {
                return this.tracksEnabled
            },
            'is required if tracks are enabled',
        ],
    },
    challengesEnabled: false,
    challenges: {
        type: [ChallengeSchema.mongoose],
        default: [],
        validate: [
            function(val) {
                if (this.challengesEnabled) {
                    return val.length > 0
                }
                return true
            },
            'must have at least one item if challenges are enabled',
        ],
        required: [
            function() {
                return this.challengesEnabled
            },
            'is required if challenges are enabled',
        ],
    },
    travelGrantConfig: {
        type: TravelGrantConfigSchema.mongoose,
        default: TravelGrantConfigSchema.mongoose,
    },
    reviewMethod: {
        type: String,
        required: true,
        default: ReviewingMethods.gavelPeerReview.id,
        enum: Object.keys(ReviewingMethods),
    },
    overallReviewMethod: {
        type: String,
        enum: Object.keys(OverallReviewingMethods),
        required: [
            function() {
                return this.tracksEnabled
            },
            'is required if tracks are enabled',
        ],
    },
    userDetailsConfig: {
        /** Deprecated, removed in migration 00-registration-questions */
        type: UserDetailsConfigSchema.mongoose,
    },
    registrationConfig: {
        /** Introduced in favor of userDetailsConfig in 00-registration-questions */
        type: RegistrationConfigSchema.mongoose,
        default: RegistrationConfigSchema.mongoose,
    },
    customQuestions: {
        type: [RegistrationSectionSchema.mongoose],
    },
    tags: {
        type: [EventTagSchema.mongoose],
        default: [],
    },
    /** System metadata */
    published: {
        type: Boolean,
        default: false,
        required: true,
    },
    galleryOpen: {
        type: Boolean,
        default: false,
        required: true,
        validate: [
            function(v) {
                if (v === true) {
                    return this.published
                }
                return true
            },
            `must be published before the project gallery can be opened`,
        ],
    },
    owner: {
        type: String,
        required: true,
    },
    organisers: {
        type: [String],
        default: [],
    },
    slug: {
        type: String,
        slug: 'name',
        unique: true,
        slugPaddingSize: 2,
    },
    winners: {
        type: mongoose.Mixed,
        default: {},
    },
})

EventSchema.index(
    {
        slug: 1,
    },
    {
        unique: true,
    }
)

EventSchema.plugin(mongooseSlugPlugin, {
    tmpl: '<%=name%>',
    alwaysUpdateSlug: false,
    slugOptions: {
        custom: {
            "'": '',
        },
    },
})

EventSchema.plugin(allowPublishPlugin, {
    defaultPublished: false,
})

EventSchema.plugin(updateAllowedPlugin, {
    blacklisted: ['__v', '_id', 'owner', 'createdAt', 'updatedAt', 'slug'],
})

EventSchema.set('timestamps', true)

EventSchema.post('remove', async function(doc) {
    await uploadHelper.removeEventImages(doc.slug)
})

const Event = mongoose.model('Event', EventSchema)

module.exports = Event
