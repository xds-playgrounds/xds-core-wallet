#!/bin/bash

arch=x64
configuration=Release
os_platform=win
log_prefix=WINDOWS-BUILD
build_directory=$(dirname $(dirname "$PWD"))
release_directory="/tmp/xds/${log_prefix}"
node_directory=$build_directory/xds-blockcore-experimental/src/Networks/Xds/Xdsd

# exit if error
set -o errexit

# print out a few variables
echo "current environment variables:"
echo "OS name:" $os_platform
echo "Build directory:" $build_directory
echo "Release directory:" $release_directory
echo "Architecture:" $arch
echo "Configuration:" $configuration
dotnet --info

# Initialize dependencies
echo $log_prefix STARTED restoring dotnet and npm packages
cd $build_directory
#git submodule update --init --recursive

cd $build_directory/StratisCore.UI

echo $log_prefix Running npm install
npm install --verbose
npm install --save-dev electron-winstaller
npm install --save-dev electron-builder-squirrel-windows

echo $log_prefix FINISHED restoring dotnet and npm packages

# dotnet publish
echo $log_prefix running 'dotnet publish'
cd $node_directory
#dotnet clean
#dotnet restore
dotnet publish -c $configuration -r $os_platform-$arch -v m -o $build_directory/StratisCore.UI/daemon

# node Build
cd $build_directory/StratisCore.UI
echo $log_prefix Building and packaging StratisCore.UI
npm install
npm run package:windows64
echo $log_prefix finished packaging

echo $log_prefix contents of the app-builds folder
cd $build_directory/StratisCore.UI/app-builds/
# replace the spaces in the name with a dot as CI system have trouble handling spaces in names.
for file in *.{exe}; do sudo mv "$file" `echo $file | tr ' ' '.'` 2>/dev/null || : ; done
ls -al -h

# Move files to release directory
sudo rm -rf $release_directory
sudo mkdir -p $release_directory
sudo cp -r $build_directory/StratisCore.UI/app-builds/* $release_directory

#Clear previous builds
sudo rm -rf $build_directory/StratisCore.UI/app-builds
sudo rm -rf $build_directory/StratisCore.UI/daemon
sudo rm -rf $build_directory/StratisCore.UI/dist

echo $log_prefix FINISHED build
