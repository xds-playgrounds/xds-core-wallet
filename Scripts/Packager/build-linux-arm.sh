#!/bin/bash

arch=arm
configuration=Release  
os_platform=linux
log_prefix=LINUXARM-BUILD
build_directory=$(dirname $(dirname "$PWD"))
release_directory="/tmp/Redstone/Release"

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
git submodule update --init --recursive

cd $build_directory/StratisCore.UI

echo $log_prefix Running npm install
sudo npm install --verbose

echo $log_prefix FINISHED restoring dotnet and npm packages

# dotnet publish
echo $log_prefix running 'dotnet publish'
cd $build_directory/Redstone/src/Redstone/Programs/Redstone.RedstoneFullNodeD
sudo dotnet restore
sudo dotnet publish -c $configuration -r $os_platform-$arch -v m -o $build_directory/StratisCore.UI/daemon

echo $log_prefix chmoding the Redstone.RedstoneFullNodeD file
sudo chmod +x $build_directory/StratisCore.UI/daemon/Redstone.RedstoneFullNodeD

# node Build
cd $build_directory/StratisCore.UI
echo $log_prefix Building and packaging Redstone Wallet
sudo npm install
sudo npm run package:linuxarm
echo $log_prefix finished packaging

echo $log_prefix contents of the app-builds folder
cd $build_directory/StratisCore.UI/app-builds/
# replace the spaces in the name with a dot as CI system have trouble handling spaces in names.
for file in *.{tar.gz,deb,zip}; do mv "$file" `echo $file | tr ' ' '.'` 2>/dev/null || : ; done
ls -al -h

# Move files to release directory
sudo mkdir -p $release_directory
sudo cp $build_directory/StratisCore.UI/app-builds/* $release_directory #2>/dev/null

#Clear previous builds
sudo rm -rf $build_directory/StratisCore.UI/app-builds/*
sudo rm -f $build_directory/StratisCore.UI/app-builds/*

echo $log_prefix FINISHED build




