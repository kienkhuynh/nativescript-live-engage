import * as common from './live-engage.common';
import frameModule = require("ui/frame");

declare const LPMessagingSDK : any;
declare const LPUser : any;
declare const UIView : any;

interface LPMessagingSDKdelegate {
    LPMessagingSDKConnectionStateChangedBrandID(isReady: boolean, brandID: string);
    LPMessagingSDKAgentIsTypingStateChanged(isTyping: boolean);

    LPMessagingSDKObseleteVersion(error: NSError);
    LPMessagingSDKAuthenticationFailed(error: NSError);
    LPMessagingSDKTokenExpired(brandID: string);
    LPMessagingSDKError(error: NSError);
}
declare let LPMessagingSDKdelegate: {
    prototype: LPMessagingSDKdelegate;
};

export class LiveEngage extends common.LiveEngage {
    private _ios: UIView;
    private _viewController: UIViewController;

    public constructor() {
        super();

        const screenFrame = this.mainScreen.bounds;

        this._ios = new UIView();
        this._ios.frame = screenFrame;
        this._ios.clipsToBounds = true;
        this.ios.autoresizingMask =
            UIViewAutoresizing.FlexibleWidth |
            UIViewAutoresizing.FlexibleHeight;

        this._viewController = UIViewController.new();
        this._viewController.view.frame = screenFrame;
        this._viewController.view.clipsToBounds = true;
        this._viewController.view.userInteractionEnabled = true;
        this._viewController.view.autoresizingMask =
            UIViewAutoresizing.FlexibleWidth |
            UIViewAutoresizing.FlexibleHeight;

        this._ios.addSubview(this._viewController.view);

        console.log('LPMessagingSDK loadChat');
        // this.loadChat('12345678', 'com.example.myapp');
    }

    private get mainScreen() {
        return typeof UIScreen.mainScreen === 'function' ?
            UIScreen.mainScreen():  // xCode 7 and below
            UIScreen.mainScreen;     // xCode 8+
    }

    public get ios(): UIView {
        return this._ios;
    }

    public set ios(value) {
        this._ios = value;
    }

    public static initializeChat(brandId: string): void {
        if (!brandId) {
            return;
        }
        try {
            LPMessagingSDK.instance.initializeError(brandId);
            console.log('LPMessagingSDK initialize success');
        } catch (e) {
            console.log('LPMessagingSDK initialize error');
            console.error(e);
        }

        LPMessagingSDK.instance.delegate = new LPMessagingSDKdelegateImpl();

        console.log('LPMessagingSDK start logging');
        LPMessagingSDK.instance.subscribeLogEventsLogEvent(0, (logEvent: any) => {
            // console.log('LPMessagingSDK LOGGG');
            // console.log(logEvent.text)

        });
    }

    public loadChat(brandId: string, appId: string) {
        if (!brandId || !appId || !this.ios) {
            return;
        }

        console.log('A1 LPMessagingSDK loadChat ready: ', LPMessagingSDK.instance.isBrandReady(brandId));
        this.showReady(brandId);

        const conversationQuery = LPMessagingSDK.instance.getConversationBrandQuery(brandId);
        console.log('A2 LPMessagingSDK loadChat conversationQuery');
        LPMessagingSDK.instance.showConversationAuthenticationCodeContainerViewController(conversationQuery, null, this._viewController);
        console.log('A3 LPMessagingSDK loadChat showConversationAuthenticationCodeContainerViewController');
        console.log('A4 LPMessagingSDK loadChat ready: ', LPMessagingSDK.instance.isBrandReady(brandId));

        this.setUserProfile();
    }

    public setUserProfile() {
        const user = LPUser.alloc().initWithFirstNameLastNameNickNameUidProfileImageURLPhoneNumberEmployeeID(this.firstName, this.lastName, "", "", "", this.phone, "");
        LPMessagingSDK.instance.setUserProfileBrandID(user, this.brandId);
    }
    
    private showReady(brandId: string) {
        setTimeout(() => {
            console.log('B LPMessagingSDK loadChat ready: ', LPMessagingSDK.instance.isBrandReady(brandId));
            this.showReady(brandId);
        }, 5000);
    }
}

class LPMessagingSDKdelegateImpl extends NSObject implements LPMessagingSDKdelegate {

    public static ObjCProtocols = [LPMessagingSDKdelegate];

    static new(): LPMessagingSDKdelegateImpl {
        return <LPMessagingSDKdelegateImpl>super.new();// calls new() on the NSObject
    }

    LPMessagingSDKConnectionStateChangedBrandID(isReady: boolean, brandID: string) {
        console.log('LPMessagingSDKConnectionStateChangedBrandID: ', isReady, brandID);
    }

    LPMessagingSDKAgentIsTypingStateChanged(isTyping: boolean) {
        console.log('LPMessagingSDKAgentIsTypingStateChanged: ', isTyping);
    }

    // required methods:

    LPMessagingSDKObseleteVersion(error: NSError) {
        console.log('LPMessagingSDKObseleteVersion error');
        console.error(error);
    }

    LPMessagingSDKAuthenticationFailed(error: NSError) {
        console.log('LPMessagingSDKAuthenticationFailed error');
        console.error(error);
    }

    LPMessagingSDKTokenExpired(brandID: string) {
        console.log('LPMessagingSDKTokenExpired brandID');
        console.log(brandID);
    }

    LPMessagingSDKError(error: NSError) {
        console.log('LPMessagingSDKError error');
        console.error(error);
    }
}