import { CommonLiveEngage, ChatProfile } from './live-engage.common';
import * as application from 'application';

declare const com: any;
declare const android: any;

export class LiveEngage implements CommonLiveEngage {

    private static instance: LiveEngage = new LiveEngage();
    private brandId: string;
    private appId: string;
    private chatProfile: ChatProfile;
    private gcmToken: string;

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
        this.brandId = brandId;
        this.appId = appId;
    }

    private getSDKVersion(): string {
        return com.liveperson.infra.BuildConfig.VERSION_NAME;
    };

    private isValidState(): boolean {
        return com.liveperson.infra.messaging_ui.MessagingUIFactory.getInstance().isInitialized();
    }

    public showChat(): void {
        if (!this.brandId || !this.appId) {
            return;
        }

        const that = new WeakRef<LiveEngage>(this);
        const Callback: any = com.liveperson.infra.callbacks.InitLivePersonCallBack.extend({
            onInitSucceed: () => {
                com.liveperson.infra.messaging_ui.MessagingUIFactory.getInstance().showConversation(application.android.foregroundActivity, this.brandId, null);
                const instance = that.get();
                instance.setUserProfileValues(instance.chatProfile);
                instance.registerPushToken(instance.gcmToken);
            },
            onInitFailed: (err: any) => {
                console.error(err);
            }
        });

        let properties = new com.liveperson.infra.InitLivePersonProperties(this.brandId, this.appId, new Callback());
        if (!com.liveperson.infra.InitLivePersonProperties.isValid(properties)) {
            if (properties != null && properties.getInitCallBack() != null) {
                properties.getInitCallBack().onInitFailed("InitLivePersonProperties not valid or missing parameters.");
            }
            return;
        }
        // check if initialized
        if (!this.isValidState()) {
            com.liveperson.infra.messaging_ui.configuration.UIConfigurationKeys.setDefaultConfiguration(application.android.context);
            const messagingUiInitData = new com.liveperson.infra.messaging_ui.MessagingUiInitData(properties, this.getSDKVersion());
            const initData = new com.liveperson.infra.messaging_ui.MessagingUiConfiguration(null);
            com.liveperson.infra.messaging_ui.MessagingUIFactory.getInstance().init(application.android.context, messagingUiInitData, initData);
        } else {
            properties.getInitCallBack().onInitSucceed();
            com.liveperson.infra.messaging_ui.MessagingUIFactory.getInstance().setConfiguration(new com.liveperson.infra.messaging_ui.MessagingUiConfiguration(null));
        }
    }

    public setUserProfileValues(chatProfile: ChatProfile): void {
        this.chatProfile = chatProfile;

        if (!this.brandId || !chatProfile) {
            return;
        }

        if (this.isValidState()) {
            const userProfile = new com.liveperson.messaging.model.UserProfileBundle.Builder()
                .setFirstName(chatProfile.firstName)
                .setLastName(chatProfile.lastName)
                .setPhoneNumber(chatProfile.phone)
                .setNickname(chatProfile.nickName)
                .setAvatarUrl(chatProfile.avatarUrl)
                .build();
            com.liveperson.messaging.MessagingFactory.getInstance().getController().sendUserProfile(this.brandId, userProfile);
        }
    }

    public registerPushToken(token: any, delegate?: any): void {
        this.gcmToken = token;
        if (!this.isValidState()) {
            return;
        }
        com.liveperson.messaging.MessagingFactory.getInstance().getController().registerPusher(this.brandId, this.appId, token);
    }

    public unregisterPushToken(): void {
        if (!this.isValidState()) {
            return;
        }
        com.liveperson.messaging.MessagingFactory.getInstance().getController().unregisterPusher(this.brandId, this.appId, null, false);
    }

    public handlePushMessage(data: any, image?: any, showNotification?: boolean): void {
        if (!this.isValidState()) {
            return;
        }

        const message = data.getString("message");
        com.liveperson.infra.messaging_ui.notification.NotificationController.instance.addMessageAndDisplayNotification(application.android.context, this.brandId, message, showNotification, image);
    }

    public parsePushMessage(data: any): any {
        return new com.liveperson.infra.messaging_ui.uicomponents.PushMessageParser(data);
    }

    public killChat(): void {
        console.log('LiveEngage start killChat');
        if (!this.brandId || !this.appId) {
            return;
        }

        if (!this.isValidState()) {
            return;
        }
        console.log('LiveEngage killChat second step');

        com.liveperson.messaging.MessagingFactory.getInstance().getController().resolveConversation(this.brandId, this.brandId);
        console.log('LiveEngage resolveConversation done');

        const LogoutCallback: any = com.liveperson.infra.callbacks.LogoutLivePersonCallBack.extend({
            onLogoutSucceed: () => {
                console.log('LiveEngage onLogoutSucceed');
            },
            onLogoutFailed: (err: any) => {
                console.log('LiveEngage onLogoutFailed');
                console.error(err);
            }
        });
        const initProperties = new com.liveperson.infra.InitLivePersonProperties(this.brandId, this.appId, null);
        const ui = new com.liveperson.infra.messaging_ui.MessagingUiInitData(initProperties, this.getSDKVersion());
        com.liveperson.infra.messaging_ui.MessagingUIFactory.getInstance().logout(application.android.context, ui, new LogoutCallback());
        console.log('LiveEngage logout');
    }
}
