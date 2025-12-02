// 资源加载器
// Author wujian
// Email 393817707@qq.com
// Date 2025.10.22

import { AssetManager, assetManager, Asset, __private } from 'cc';

class AssetLoadTask {
    public id: number = 0;
    public assets: any = null!;
    public onProgress: Function | null = null;
    public onComplete: Function | null = null;
    private current: number = 0;
    private total: number = 0;
    private bundleIndex: number = 0;
    private assetIndex: number = 0;
    private pathIndex: number = 0;
    
    public start() {
        // 统计资源总数
        for (let i = 0; i < this.assets.length; i++) {
            let assetList = this.assets[i].assetList;
            for (let j = 0; j < assetList.length; j++) {
                let paths = assetList[j].paths;
                this.total += paths.length;
            }
        }
        // 开始加载资源
        this.loadBundleItem();
    }

    private loadBundleItem() {
        if (this.bundleIndex < this.assets.length) {
            this.loadBundleItemImpl(this.assets[this.bundleIndex]);
        } else {
            ResourceLoader.Instance.onLoadComplete(this);
            if (this.onProgress) {
                this.onProgress(this.total, this.total);
            }
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    private loadBundleItemImpl(bundleItem: any) {
        assetManager.loadBundle(bundleItem.bundleName, (err: Error | null, bundle: AssetManager.Bundle) => {
            if (err) {
                console.log("Load bundle error: ", err);
                ResourceLoader.Instance.onLoadComplete(this);
                return;
                
            } else {
                this.assetIndex = 0;
                this.loadAssetItem(bundle);
            }
        });
    }

    private loadAssetItem(bundle: AssetManager.Bundle) {
        let assetList = this.assets[this.bundleIndex].assetList;
        if (this.assetIndex < assetList.length) {
            this.pathIndex = 0;
            this.loadPathItem(bundle);
        } else {
            this.bundleIndex += 1;
            this.loadBundleItem();
        }
    }

    private loadPathItem(bundle: AssetManager.Bundle) {
        let assetList = this.assets[this.bundleIndex].assetList;
        let assetItem = assetList[this.assetIndex];
        if (this.pathIndex < assetItem.paths.length) {
            this.loadPathItemImpl(bundle, assetItem.assetType, assetItem.paths[this.pathIndex]);
        } else {
            this.assetIndex += 1;
            this.loadAssetItem(bundle);
        }
    }

    private loadPathItemImpl(bundle: AssetManager.Bundle, assetType: any, path: string) {
        bundle.load(path, assetType, (err: Error | null, asset: any) => {
            this.current += 1;
            if (this.onProgress) {
                this.onProgress(this.current, this.total);
            }
            if (err) {
                console.log("Load asset error: ", err);
                ResourceLoader.Instance.onLoadComplete(this);
                return;
            }
            this.pathIndex += 1;
            this.loadPathItem(bundle);
        });
    }
}

export class ResourceLoader  {
    private static _instance: ResourceLoader = null;

    private tasks: AssetLoadTask[] = [];

    private taskId: number = 1;

    public static get Instance(): ResourceLoader {
        if (ResourceLoader._instance == null) {
            ResourceLoader._instance = new ResourceLoader();
        }
        return ResourceLoader._instance;
    }

    /**
     * 加载资源
     * @param assets 资源表单，格式如：[ { bundleName: "xxx", assetList: [ { assetType: xxx, paths: ["xxx", ...] }, ...]}, ...]
     * @param onProgress 加载进度回调函数
     * @param onComplete 加载完成回调函数
     */
    public loadAssets(assets: any, onProgress: ((current: number, total: number) => void) | null, onComplete: (() => void) | null) {
        if (!assets) return;
        let task: AssetLoadTask = new AssetLoadTask();
        task.id = this.taskId;
        task.assets = assets;
        task.onProgress = onProgress;
        task.onComplete = onComplete;
        this.tasks.push(task);
        this.taskId += 1;
        task.start();
    }

    public onLoadComplete(task: AssetLoadTask) {
        // 删除指定任务
        let index = this.tasks.findIndex((tmp) => { return (tmp.id === task.id); });
        if (index !== -1) {
            this.tasks.splice(index, 1);
        }
    }

    public loadAsset<T extends Asset>(bundleName: string, assetPath: string, assetType: __private.__types_globals__Constructor<T> | null, onComplete: ((asset: T | null) => void)) {
        assetManager.loadBundle(bundleName, (err: Error | null, bundle: AssetManager.Bundle) => {
            if (err) {
                console.log("Load bundle \'", bundleName, "\' error: ", err);
                onComplete(null);
                return;
            }
            bundle.load(assetPath, assetType, (err: Error | null, asset: T) => {
                if (err) {
                    console.log("Load asset \'", assetPath, "\' in bundle \'", bundleName, "\' error: ", err);
                    onComplete(null);
                    return;
                }
                onComplete(asset);
            });
        });
    }
}