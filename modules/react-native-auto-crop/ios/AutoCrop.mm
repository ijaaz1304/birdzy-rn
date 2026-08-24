#import "AutoCrop.h"

#if __has_include("ReactNativeAutoCrop-Swift.h")
#import "ReactNativeAutoCrop-Swift.h"
#elif __has_include("ReactNativeAutoCrop/ReactNativeAutoCrop-Swift.h")
#import "ReactNativeAutoCrop/ReactNativeAutoCrop-Swift.h"
#else
#error "ReactNativeAutoCrop-Swift.h not found"
#endif

@implementation AutoCrop {
  AutoCropSwift *autoCrop;
}

RCT_EXPORT_MODULE()

- (id)init {
  self = [super init];
  if (self) {
    autoCrop = [[AutoCropSwift alloc] init];
  }
  return self;
}

RCT_EXPORT_METHOD(cropImage:(NSString *)imageURI
                  paddingRatio:(double)paddingRatio
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject)
{
  [autoCrop cropImage:imageURI paddingRatio:paddingRatio resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(flattenCutoutOnWhite:(NSString *)imageURI
                  quality:(double)quality
                  resolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject)
{
  [autoCrop flattenCutoutOnWhite:imageURI quality:quality resolve:resolve reject:reject];
}

@end
