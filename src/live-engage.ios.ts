import { CommonLiveEngage, ChatProfile } from './live-engage.common';

declare const LPMessagingSDK: any;
declare const LPUser: any;

export class LiveEngage implements CommonLiveEngage {

    private static instance: LiveEngage = new LiveEngage();
    private authCode: string;
    private brandId: string;
    private appId: string;
    private chatProfile: ChatProfile;
    private apnsToken: any;
    private apnsDelegate: any;

    constructor() {
        if (LiveEngage.instance) {
            throw new Error("Error: Instance failed: Use LiveEngage.getInstance() instead of new.");
        }
        LiveEngage.instance = this;
    }

    static getInstance() {
        return LiveEngage.instance;
    }

    public initializeChat(brandId: string, appId: string): void {
        if (!brandId) {
            return;
        }

        try {
            LPMessagingSDK.instance.initializeError(brandId);
            this.brandId = brandId;
            this.appId = appId;
        } catch (e) {
            console.error(e);
        }
    }

    public enableLogging(logLevel: number): void {
        LPMessagingSDK.instance.subscribeLogEventsLogEvent(logLevel, ((log: any) => {
            console.log('LPMessagingSDK log:', log);
        }));
    }

    public showChat(): void {
        if (!this.brandId) {
            return;
        }

        const conversationQuery = LPMessagingSDK.instance.getConversationBrandQuery(this.brandId);
        LPMessagingSDK.instance.showConversationAuthenticationCodeContainerViewController(conversationQuery, this.authCode, null);
        this.setUserProfileValues(this.chatProfile);
        this.registerPushToken(this.apnsToken, this.apnsDelegate);
    }

    public closeChat(): void {
        LPMessagingSDK.instance.removeConversation(null);
    }

    public setUserProfileValues(chatProfile: ChatProfile): void {
        this.chatProfile = chatProfile;

        if (!this.brandId || !chatProfile) {
            return;
        }

        const user = LPUser.alloc().initWithFirstNameLastNameNickNameUidProfileImageURLPhoneNumberEmployeeID(
            chatProfile.firstName,
            chatProfile.lastName,
            chatProfile.nickName,
            "",
            chatProfile.avatarUrl,
            chatProfile.phone,
            "");
        LPMessagingSDK.instance.setUserProfileBrandID(user, this.brandId);
    }

    public setAuthenticationCode(authCode) {
        this.authCode = authCode;
    }

    // getting unread message count will only work with enabled push notifications
    public getUnreadMessagesCount(): Promise<number> {
        const conversationQuery = LPMessagingSDK.instance.getConversationBrandQuery(this.brandId);
        return new Promise((resolve, reject) => {
            LPMessagingSDK.getUnreadMessagesCountCompletionFailure(
                conversationQuery,
                (count: number) => resolve(count),
                (error: any) => reject(error)
            );
        });
    }

    public registerPushToken(token: any, delegate?: any): void {
        this.apnsToken = token;
        this.apnsDelegate = delegate;
        if (!this.appId || !token) {
            return;
        }

        LPMessagingSDK.instance.registerPushNotificationsWithTokenNotificationDelegateAlternateBundleID(token, this.apnsDelegate, this.appId);
    }

    public unregisterPushToken(): void {
        // not available on iOS
    }

    public handlePushMessage(data: any, image?: any, showNotification?: boolean): void {
        LPMessagingSDK.instance.handlePush(data);
    }

    public parsePushMessage(data: any): any {
        // not available on iOS
        return;
    }

    public killChat(): Promise<boolean> {
        return new Promise((resolve) => {
            LPMessagingSDK.instance.logout();
            resolve(true);
        });
    }
}
