#!/bin/bash
echo "Aplicando fixes post cap sync android..."
sed -i '' 's/VERSION_21/VERSION_17/g' android/app/capacitor.build.gradle
echo "capacitor.build.gradle actualizado"
sed -i '' 's/minSdkVersion = 24/minSdkVersion = 26/g' android/variables.gradle
echo "variables.gradle actualizado"
echo "Post-sync fixes completados"
