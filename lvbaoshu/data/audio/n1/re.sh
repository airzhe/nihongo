#!/bin/bash
for file in *.mp3; do
  newname=$(echo "$file" |   sed -E 's/^[^_]+_(.*?)_segment_srt[0-9]+_proc[0-9]+_(.*)$/\1_\2/')
  echo "处理文件: $file, 新文件名: $newname"
  mv "$file" "$newname"  # 取消注释以实际重命名
done
