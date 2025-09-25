#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(LinphoneModule, RCTEventEmitter)
RCT_EXTERN_METHOD(init:(NSDictionary *)cfg)
RCT_EXTERN_METHOD(register:(NSDictionary *)acc)
RCT_EXTERN_METHOD(call:(NSString *)sipUri)
RCT_EXTERN_METHOD(answer)
RCT_EXTERN_METHOD(hangup)
RCT_EXTERN_METHOD(end)
RCT_EXTERN_METHOD(decline:(NSString *)reason)
RCT_EXTERN_METHOD(mute:(BOOL)on)
RCT_EXTERN_METHOD(speaker:(BOOL)on)
RCT_EXTERN_METHOD(sendDtmf:(NSString *)d)
RCT_EXTERN_METHOD(hold)
RCT_EXTERN_METHOD(resume)
RCT_EXTERN_METHOD(setRegisterEnabled:(BOOL)on)
RCT_EXTERN_METHOD(playKeyTone:(NSString *)d)
@end
