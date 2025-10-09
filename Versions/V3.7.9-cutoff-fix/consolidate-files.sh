#!/bin/bash

# Consolidate files from space-named directories into underscore directories

echo "🔄 Consolidating files into underscore directories..."

cd /Users/wecanmusic/Downloads/Dan\ Tranh\ Tablature/v3/data/processed

# Map of space names to underscore names
declare -A dir_map=(
    ["Bà rằng bà rí"]="Bà_rằng_bà_rí"
    ["Bài chòi"]="Bài_chòi"
    ["Bát bồng, nhất trò, xuân nữ"]="Bát_bồng__nhất_trò__xuân_nữ"
    ["Bengu Adai"]="Bengu_Adai"
    ["Bỏ bộ"]="Bỏ_bộ"
    ["Bồ Các là bác chim Ri"]="Bồ_Các_là_bác_chim_Ri"
    ["Buộc lưng con ếch"]="Buộc_lưng_con_ếch"
    ["Cặp bù kè"]="Cặp_bù_kè"
    ["Cậu khóa ơi!"]="Cậu_khóa_ơi_"
    ["Chàng đi săn"]="Chàng_đi_săn"
    ["chi chi chành chành"]="chi_chi_chành_chành"
    ["chiều chiều"]="chiều_chiều"
    ["Cò lả"]="Cò_lả"
    ["Cô nói sao"]="Cô_nói_sao"
    ["Dâng rượu"]="Dâng_rượu"
    ["Dệt cửi"]="Dệt_cửi"
    ["Giã cá"]="Giã_cá"
    ["Giặm Đức sơn (2)"]="Giặm_Đức_sơn__2_"
    ["Giặm Đức Sơn"]="Giặm_Đức_Sơn"
    ["giặm vè"]="giặm_vè"
    ["Giáo trống"]="Giáo_trống"
    ["Hài già xung"]="Hài_già_xung"
    ["Hát Bồng Mạc"]="Hát_Bồng_Mạc"
    ["hát chèo tàu"]="hát_chèo_tàu"
    ["Hát chúc tết"]="Hát_chúc_tết"
    ["hát cuộc"]="hát_cuộc"
    ["Hát ru (Cò vạc nông)"]="Hát_ru__Còn_vạc_nông_"
    ["Hát ru (Sông Cầu, Phú Yên)"]="Hát_ru__Sông_Cầu__Phú_Yên_"
    ["Hát ru 210 (1)"]="Hát_ru_210__1_"
    ["Hát ru con"]="Hát_ru_con"
    ["Hát ru em (quảng bình)"]="Hát_ru__em__quảng_bình_"
    ["Hát ru em 276"]="Hát_ru_em_276"
    ["Hát ru lối Giặm"]="Hát_ru_lối_Giặm"
    ["Hát ru lục vân tiên 210"]="Hát_ru_lục_vân_tiên_210"
    ["hát ru miền bắc"]="hát_ru_miền_bắc"
    ["hát ru miền trung du"]="hát_ru_miền_trung_du"
    ["Hát ru nam bộ"]="Hát_ru_nam_bộ"
    ["Hát ru Thùa thiên - Huế"]="Hát_ru_Thùa_thiên___Huế"
    ["Hát ru( trích)"]="Hát_ru__trích_"
    ["Hát trách"]="Hát_trách"
    ["Hầu Mi Xèo"]="Hầu_Mi_Xèo"
    ["Hò Ba lý (trích)"]="Hò_Ba_lý__trích_"
    ["Hò Ba lý"]="Hò_Ba_lý"
    ["Hò Bơi thuyền"]="Hò_Bơi_thuyền"
    ["Hò cập bến"]="Hò_cấp_bến"
    ["Hò chèo ghe đồng tháp"]="Hò_chèo_ghe_đồng_tháp"
    ["Hò cống chùa"]="Hò_cống_chùa"
    ["Hò Đắp Đê"]="Hò_Đắp_Đê"
    ["Hò đò dọc"]="Hò_đò_dọc"
    ["Hò Dố khoan Dố huầy (Hò chèo thuyền)"]="Hò_Dố_khoan_Dố_huầy__Hò_chèo_thuyền_"
    ["Hò đối đáp"]="Hò_đối_đáp"
    ["Hò đưa linh"]="Hò_đưa_linh"
    ["Hò đường trường"]="Hò_đường_trường"
    ["Hò giã gạo"]="Hò_giã_gạo"
    ["Hò giật chì"]="Hò_giật_chì"
    ["Hò hái củi"]="Hò_hái_củi"
    ["Hò kéo thác"]="Hò_kéo_thác"
    ["Hò mái ba gò công"]="Hò_mái_ba_gò_công"
    ["Hò mài dừa"]="Hò_màu_dừa"
    ["Hò mái nhì"]="Hò_mái_nhì"
    ["Hò nện"]="Hò_nện"
    ["Hò qua sông hái củi"]="Hò_qua_sông_hái_củi"
    ["Hò ru em cảnh dương (quảng bình)"]="Hò_ru_em_cảnh_dương__quảng_bình_"
    ["Hò Ru ngủ"]="Hò_Ru_ngủ"
    ["Hò xuôi nhịp một đôi"]="Hò_xuôi_nhịp_một_đôi"
)

# Continue with more mappings...
more_mappings=(
    "Khâu xìa:Khâu_xìa"
    "Khổng mi nhủa:Khổng_mi_nhủa"
    "Kỳ đà là cha cắc ké:Kỳ_đà_là_cha_cắc_kè"
    "Lả nón dớ:Lả_nón_dớ"
    "Lượn cọi:Lượn_cọi"
    "Lượn quan lang:Lượn_quan_lang"
    "Lý bình vôi:Lý_bình_vôi"
    "Lý cây đa:Lý_cây_đa"
    "Lý chiều chiều:Lý_chiều_chiều"
    "Lý con cua:Lý_con_cua"
    "Lý con sáo Quảng:Lý_con_sáo_Quảng"
    "Lý hoài nam:Lý_hoài_nam"
    "Lý hoài xuân:Lý_hoài_xuân"
    "Lý thiên thai:Lý_thiên_thai"
    "lý thương nhau:lý_thương_nhau"
    "Lý tình tang:Lý_tình_tang"
    "Mơi Lảu:Mơi_Lảu"
    "Múa sạp:Múa_sạp"
    "Múa vui:Múa_vui"
    "Mười thương:Mười_thương"
    "Ngâm kiều sa mạc:Ngâm_kiều_sa_mạc"
    "Ngâm Ru (miền Bắc):Ngâm_Ru__miền_Bắc_"
    "Ngày mùa:Ngày_mùa"
    "Ngồi tựa mạn thuyền:Ngồi_tựa_mạn_thuyền"
    "nhắn cô bên sông:nhắn_cô_bên_sông"
    "Nói thơ Sáu trọng:Nói_thơ_Sáu_trọng"
    "Nước sông giăng:Nước_sông_giăng"
    "Phong ống:Phong_ống"
    "Ru con (Bình Định):Ru_con__Bình_Định_"
    "Ru con (Quảng Nam):Ru_con__Quảng_Nam_"
    "Ru con (Quảng Trị):Ru_con__Quảng_Trị_"
    "Ru con Hà Tĩnh:Ru_con_Hà_Tĩnh"
    "Ru con:Ru_con"
    "Ru em Cảnh Dương:Ru_em_Cảnh_Dương"
    "Rucon Nghệ An:Rucon_Nghệ_An"
    "thang âm:thang_âm"
    "Thắp đèn:Thắp_đèn"
    "Thiên đàng địa ngục:Thiên_đàng_địa_ngục"
    "TI DOONG TI:TI_DOONG_TI"
    "Trích ngâm thơ Huế:Trích_ngâm_thơ_Huế"
    "Trồng bông luống đậu:Trồng_bông_luống_đậu"
    "Trống cơm:Trống_cơm"
    "Trống quân đức bắc:Trống_quân_đức_bắc"
    "Trống Quân:Trống_Quân"
    "tùm lum 1:tùm_lum_1"
    "Vè con cá:Vè_con_cá"
    "Vè Quảng:Vè_Quảng"
    "Ví dụ 32:Ví_dụ_32"
    "ví dụ:ví_dụ"
    "Ví phường vải:Ví_phường_vải"
    "Ví xếp:Ví_xếp"
    "Xàng Xê:Xàng_Xê"
    "Xe Chỉ:Xe_Chỉ"
    "Xẻ Ván:Xẻ_Vàn"
    "Xỉa cá Mè:Xỉa_cá_Mè"
    "Xìn kin lẩu:Xìn_kin_lẩu"
    "Xòe hoa:Xòe_hoa"
    "Đò Đưa:Đò_Đưa"
    "Đò đưa quan họ:Đò_đưa_quan_họ"
    "Đố hoa:Đố_hoa"
    "Đúm xếp:Đúm_xếp"
    "tampot:tampot"
    "Untitled1:Untitled1"
    "Hát_ru_em:Hát_ru_em"
)

# Process each mapping
count=0
for mapping in "${more_mappings[@]}"; do
    IFS=':' read -r space_name underscore_name <<< "$mapping"
    dir_map["$space_name"]="$underscore_name"
done

# Now consolidate files
for space_dir in "${!dir_map[@]}"; do
    underscore_dir="${dir_map[$space_dir]}"

    if [ -d "$space_dir" ] && [ -d "$underscore_dir" ]; then
        echo "Consolidating: $space_dir → $underscore_dir"

        # Copy all files from space directory to underscore directory
        if [ -f "$space_dir/relationships.json" ]; then
            cp "$space_dir/relationships.json" "$underscore_dir/"
        fi

        if [ -f "$space_dir/complete-dual-panel.html" ]; then
            cp "$space_dir/complete-dual-panel.html" "$underscore_dir/"
        fi

        # Remove the space directory after copying
        rm -rf "$space_dir"
        ((count++))
    fi
done

echo ""
echo "✅ Consolidation complete!"
echo "   Directories processed: $count"

# Verify final structure
echo ""
echo "📊 Verifying final structure:"
echo "   Total directories: $(ls -d */ | wc -l)"
echo "   Directories with metadata.json: $(find . -name 'metadata.json' | wc -l)"
echo "   Directories with relationships.json: $(find . -name 'relationships.json' | wc -l)"
echo "   Directories with complete-dual-panel.html: $(find . -name 'complete-dual-panel.html' | wc -l)"
echo "   Directories with viewer.html: $(find . -name 'viewer.html' | wc -l)"
echo "   Directories with thumbnail.svg: $(find . -name 'thumbnail.svg' | wc -l)"