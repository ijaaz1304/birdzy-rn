source 'https://rubygems.org'

# macOS ships Ruby 2.6; CocoaPods deps (e.g. ffi 1.17+) need Ruby >= 3.0.
# Install: brew install ruby && add $(brew --prefix ruby)/bin to PATH
ruby ">= 3.0.0"

# Exclude problematic versions of cocoapods and activesupport that causes build failures.
gem 'cocoapods', '>= 1.13', '!= 1.15.0', '!= 1.15.1'
gem 'activesupport', '>= 6.1.7.5', '!= 7.1.0'
gem 'xcodeproj', '< 1.26.0'
gem 'concurrent-ruby', '< 1.3.4'

# Ruby 3.4.0 has removed some libraries from the standard library.
gem 'base64'
gem 'bigdecimal'
gem 'logger'
gem 'benchmark'
gem 'mutex_m'
