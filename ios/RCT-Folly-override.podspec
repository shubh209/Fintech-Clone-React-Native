Pod::Spec.new do |s|
  s.name         = "RCT-Folly"
  s.version      = "2022.05.16.00"
  s.summary      = "Folly is an open-source C++ library developed and used at Facebook."
  s.description  = "Fallback override for Folly."
  s.homepage     = "https://github.com/facebook/folly"
  s.license      = { :type => 'Apache 2.0', :file => 'LICENSE' }
  s.author       = { 'Facebook' => 'folly@fb.com' }
  s.source       = { :path => "../node_modules/react-native/third-party-podspecs/RCT-Folly.podspec" }
  s.source_files = "RCT-Folly.podspec"
end
