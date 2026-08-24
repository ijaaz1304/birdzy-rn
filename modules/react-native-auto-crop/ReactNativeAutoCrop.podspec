require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "ReactNativeAutoCrop"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = "https://github.com/trackzio/react-native-auto-crop"
  s.license      = "MIT"
  s.authors      = "Trackzio"
  s.platforms    = { :ios => "15.1" }
  s.source       = { :git => "https://github.com/trackzio/react-native-auto-crop.git", :tag => "#{s.version}" }
  s.source_files = "ios/**/*.{h,m,mm,swift}"

  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"
  end
end
